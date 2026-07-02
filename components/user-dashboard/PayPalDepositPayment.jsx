'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { useWebsiteT } from '@/components/i18n/WebsiteLocaleProvider';
import { formatPayPalUserError } from '@/lib/formatPayPalUserError';
import {
  PAYPAL_SANDBOX_TEST_CARD,
  formatPayPalTestCardDisplay,
} from '@/lib/paypalSandboxTestCards';
import {
  PayPalProvider,
  PayPalOneTimePaymentButton,
  PayPalCardFieldsProvider,
  PayPalCardNumberField,
  PayPalCardExpiryField,
  PayPalCardCvvField,
  usePayPal,
  usePayPalCardFields,
  usePayPalCardFieldsOneTimePaymentSession,
  INSTANCE_LOADING_STATE,
} from '@paypal/react-paypal-js/sdk-v6';

function getPayPalClientId() {
  return String(process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '').trim();
}

function getPayPalEnvironment() {
  return process.env.NEXT_PUBLIC_PAYPAL_ENVIRONMENT === 'production'
    ? 'production'
    : 'sandbox';
}

function PayPalUserErrorAlert({ message, title }) {
  const { t } = useWebsiteT();
  const resolvedTitle = title ?? t('dashboard.deposit.paymentErrorTitle');
  if (!message) return null;
  return (
    <div
      role="alert"
      className="rounded-lg border border-rose-500/40 bg-rose-950/50 px-4 py-3 text-sm text-rose-100"
    >
      <p className="font-semibold text-rose-50">{resolvedTitle}</p>
      <p className="mt-1.5 text-xs leading-relaxed text-rose-200/95">{message}</p>
    </div>
  );
}

function PayPalStatusAlert({ message }) {
  if (!message) return null;
  return (
    <div className="rounded-lg border border-blue-400/30 bg-blue-500/10 px-4 py-3 text-xs text-blue-100">
      {message}
    </div>
  );
}

const PAYPAL_BILLING_ADDRESS = {
  addressLine1: '123 Main St',
  adminArea2: 'New York',
  adminArea1: 'NY',
  postalCode: '10001',
  countryCode: 'US',
};

const paypalCardFieldStyle = {
  input: {
    color: '#000',
    background: 'transparent !important',
    fontSize: '16px',
    lineHeight: '24px',
    fontFamily: 'inherit',
    fontWeight: '400',
  },
  ':focus': {
    color: '#000',
    background: 'transparent',
    outline: 'none',
  },
  '::placeholder': {
    color: 'rgba(191, 191, 191, 0.5)',
  },
  body: {
    background: 'transparent',
  },
  '.invalid': {
    color: '#fda4af',
  },
};

const fieldContainerStyle = {
  height: '2.75rem',
  marginBottom: '0.75rem',
  borderRadius: '0.5rem',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  background: 'transparent',
  backgroundColor: 'transparent',
  overflow: 'hidden',
  paddingLeft: '0.5rem',
  paddingRight: '0.5rem',
};

async function captureWithRetries({ depositId, orderId, authToken, maxAttempts = 5 }) {
  let lastError = null;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 1200 * attempt));
    try {
      const res = await fetch('/api/user/deposit/paypal/capture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({ depositId, orderId }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.ok) return json;
      lastError = new Error(json.error || 'Could not complete PayPal payment.');
      if (json.code === 'PAYER_CANNOT_PAY') break;
      if (json.code === 'PAYPAL_3DS_REQUIRED') break;
      if (json.code !== 'PAYPAL_ORDER_NOT_READY') break;
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError || new Error('Could not complete PayPal payment.');
}

function PayPalSdkGate({ children }) {
  const { t } = useWebsiteT();
  const { loadingStatus, error, isHydrated } = usePayPal();

  if (!isHydrated || loadingStatus === INSTANCE_LOADING_STATE.PENDING) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-blue-500/25 bg-blue-950/30 px-4 py-5 text-sm text-blue-100">
        <Loader2 className="h-5 w-5 animate-spin" />
        {t('dashboard.paypal.loading')}
      </div>
    );
  }

  if (loadingStatus === INSTANCE_LOADING_STATE.REJECTED || error) {
    return (
      <PayPalUserErrorAlert
        title={t('dashboard.deposit.paymentErrorTitle')}
        message={formatPayPalUserError(error, t('dashboard.paypal.sdkLoadHint'))}
      />
    );
  }

  return children;
}

function PayPalCardFieldsSection({
  orderId,
  depositId,
  amountUsd,
  authToken,
  processingPayment,
  setProcessingPayment,
  paypalInlineError,
  setPaypalInlineError,
  paypalStatusNote,
  setPaypalStatusNote,
  onPaymentComplete,
  onRetry,
  toast,
}) {
  const { t } = useWebsiteT();
  const { error: fieldsError } = usePayPalCardFields();
  const { submit, submitResponse, error: submitError } =
    usePayPalCardFieldsOneTimePaymentSession();

  const showError = useCallback(
    (err, fallback) => {
      const msg = formatPayPalUserError(err, fallback);
      setPaypalInlineError(msg);
      return msg;
    },
    [setPaypalInlineError]
  );

  useEffect(() => {
    if (!fieldsError) return;
    showError(fieldsError, t('dashboard.paypal.cardFieldsLoadError'));
  }, [fieldsError, showError, t]);

  useEffect(() => {
    if (!submitError) return;
    setProcessingPayment(false);
    showError(submitError, t('dashboard.paypal.cardSubmitError'));
  }, [submitError, setProcessingPayment, showError, t]);

  useEffect(() => {
    if (!submitResponse) return;

    const run = async () => {
      const { state, data } = submitResponse;
      const responseOrderId = String(data?.orderId || orderId || '');

      if (state === 'canceled') {
        setProcessingPayment(false);
        setPaypalInlineError(t('dashboard.paypal.cancelled3ds'));
        return;
      }

      if (state === 'failed') {
        setProcessingPayment(false);
        const msg = formatPayPalUserError(
          data?.message
            ? new Error(String(data.message))
            : null,
          t('dashboard.paypal.cardDeclinedSandbox', {
            card: PAYPAL_SANDBOX_TEST_CARD.visa,
            expiry: PAYPAL_SANDBOX_TEST_CARD.expiry,
            cvc: PAYPAL_SANDBOX_TEST_CARD.cvv,
          })
        );
        setPaypalInlineError(msg);
        return;
      }

      if (state !== 'succeeded') return;

      setPaypalStatusNote(t('dashboard.paypal.creditingWallet'));
      try {
        await new Promise((r) => setTimeout(r, 1200));
        const json = await captureWithRetries({
          depositId,
          orderId: responseOrderId,
          authToken,
        });
        setProcessingPayment(false);
        setPaypalInlineError('');
        setPaypalStatusNote('');
        onPaymentComplete(json);
      } catch (err) {
        setProcessingPayment(false);
        showError(err, t('dashboard.paypal.captureFailedWallet'));
        toast.error(formatPayPalUserError(err, t('dashboard.paypal.error')), {
          title: t('dashboard.deposit.paymentErrorTitle'),
        });
      }
    };

    run();
  }, [
    submitResponse,
    orderId,
    depositId,
    authToken,
    onPaymentComplete,
    setPaypalInlineError,
    setPaypalStatusNote,
    setProcessingPayment,
    showError,
    toast,
    t,
  ]);

  const handlePayWithCard = async () => {
    if (!orderId) {
      showError(null, t('dashboard.paypal.sessionExpired'));
      return;
    }
    setProcessingPayment(true);
    setPaypalInlineError('');
    setPaypalStatusNote(t('dashboard.paypal.verifying3ds'));
    try {
      await submit(orderId, { billingAddress: PAYPAL_BILLING_ADDRESS });
    } catch (err) {
      setProcessingPayment(false);
      setPaypalStatusNote('');
      showError(err, t('dashboard.paypal.cardSubmitFailed'));
    }
  };

  const isSandbox = getPayPalEnvironment() === 'sandbox';

  return (
    <div className="space-y-4">
      {/* <div className="rounded-lg border border-blue-400/25 bg-blue-950/40 px-4 py-3 text-sm text-blue-100">
        <p>
          Amount: <strong className="text-white">${Number(amountUsd).toFixed(2)} USD</strong>
        </p>
        <p className="mt-2 text-xs text-blue-200/85">
          Enter your card below, then tap Pay. USD is added to your wallet automatically after success.
        </p>
      </div> */}

      <div className="mt-3 paypal-deposit-card-fields space-y-1 rounded-xl border border-blue-400/20 bg-transparent p-4">
        <label className="mb-1 block text-xs uppercase tracking-[0.08em] text-blue-200/80">
          {t('dashboard.paypal.cardNumber')}
        </label>
        <PayPalCardNumberField
          placeholder={t('dashboard.paypal.cardNumber')}
          containerStyles={fieldContainerStyle}
          containerClassName="paypal-card-field-host"
          style={paypalCardFieldStyle}
        />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.08em] text-blue-200/80">
              {t('dashboard.paypal.expiry')}
            </label>
            <PayPalCardExpiryField
              placeholder={t('dashboard.paypal.expiryPlaceholder')}
              containerStyles={fieldContainerStyle}
              containerClassName="paypal-card-field-host"
              style={paypalCardFieldStyle}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.08em] text-blue-200/80">
              {t('dashboard.paypal.cvc')}
            </label>
            <PayPalCardCvvField
              placeholder={t('dashboard.paypal.cvc')}
              containerStyles={fieldContainerStyle}
              containerClassName="paypal-card-field-host"
              style={paypalCardFieldStyle}
            />
          </div>
        </div>
        {/* {isSandbox ? (
          <p className="text-xs text-blue-200/70">
            Sandbox test card:{' '}
            <span className="font-mono text-blue-100">
              {formatPayPalTestCardDisplay(PAYPAL_SANDBOX_TEST_CARD.visa)}
            </span>
            {' · '}
            Exp <span className="font-mono">{PAYPAL_SANDBOX_TEST_CARD.expiry}</span>
            {' · '}
            CVV <span className="font-mono">{PAYPAL_SANDBOX_TEST_CARD.cvv}</span>
          </p>
        ) : null} */}
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            disabled={processingPayment}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-200 hover:text-white"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {t('dashboard.paypal.newAttempt')}
          </button>
        ) : null}
      </div>

      <button
        type="button"
        onClick={handlePayWithCard}
        disabled={processingPayment}
        className="w-full rounded-xl bg-blue-600 py-4 text-lg font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {processingPayment ? (
          <span className="inline-flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            {t('dashboard.paypal.processing')}
          </span>
        ) : (
          t('dashboard.paypal.payWithCardAmount', {
            amount: `$${Number(amountUsd).toFixed(2)}`,
          })
        )}
      </button>
    </div>
  );
}

function PayPalAccountButtonSection({
  orderId,
  depositId,
  authToken,
  processingPayment,
  paypalInlineError,
  setProcessingPayment,
  setPaypalInlineError,
  setPaypalStatusNote,
  onPaymentComplete,
}) {
  const { t } = useWebsiteT();
  const onApprove = async (data) => {
    const oid = String(data?.orderId || orderId || '');
    if (!oid) {
      setPaypalInlineError(t('dashboard.paypal.orderIdMissing'));
      return;
    }
    setProcessingPayment(true);
    setPaypalStatusNote(t('dashboard.paypal.confirmingPayment'));
    setPaypalInlineError('');
    try {
      const json = await captureWithRetries({ depositId, orderId: oid, authToken });
      setPaypalStatusNote('');
      onPaymentComplete(json);
    } catch (e) {
      setPaypalInlineError(
        formatPayPalUserError(e, t('dashboard.paypal.paymentNotCompleted'))
      );
    } finally {
      setProcessingPayment(false);
    }
  };

  const isSandbox = getPayPalEnvironment() === 'sandbox';

  return (
    <div className="mt-6 pt-6">
      {/* <p className="text-center text-sm font-medium text-white">Or pay with PayPal account</p> */}
      <div className="mx-auto mt-4 max-w-full">
        <PayPalOneTimePaymentButton
          orderId={orderId}
          presentationMode="auto"
          disabled={processingPayment}
          onApprove={onApprove}
          onError={(err) => {
            setPaypalInlineError(
              formatPayPalUserError(err, t('dashboard.paypal.checkoutFailed'))
            );
          }}
          onCancel={() => setPaypalInlineError(t('dashboard.paypal.cancelledRetry'))}
        />
      </div>
    </div>
  );
}

function PayPalDepositCardCheckout(props) {
  const { amountUsd, paypalInlineError, paypalStatusNote } = props;
  const orderAmount = useMemo(
    () => ({
      value: Number(amountUsd).toFixed(2),
      currencyCode: 'USD',
    }),
    [amountUsd]
  );

  return (
    <div className="space-y-4">
      <PayPalUserErrorAlert message={paypalInlineError} />
      <PayPalStatusAlert message={paypalStatusNote} />
      {/* <PayPalCardFieldsProvider amount={orderAmount}>
        <PayPalCardFieldsSection {...props} />
      </PayPalCardFieldsProvider> */}
      <PayPalAccountButtonSection {...props} />
    </div>
  );
}

export default function PayPalDepositPayment(props) {
  const { t } = useWebsiteT();
  const clientId = getPayPalClientId();
  const { authToken } = props;
  const [clientToken, setClientToken] = useState('');
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setAuthReady(false);
    setClientToken('');

    (async () => {
      try {
        const res = await fetch('/api/user/deposit/paypal/client-token', {
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
        });
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.ok && json.ok && json.clientToken) {
          setClientToken(String(json.clientToken).trim());
        }
      } catch {
        /* use clientId fallback */
      } finally {
        if (!cancelled) setAuthReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authToken]);

  if (!clientId) {
    return (
      <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
        {t('dashboard.paypal.notConfiguredDev')}
      </p>
    );
  }

  // if (!authReady) {
  //   return (
  //     <div className="mt-4 flex items-center gap-3 rounded-xl border border-blue-500/25 bg-blue-950/30 px-4 py-5 text-sm text-blue-100">
  //       <Loader2 className="h-5 w-5 animate-spin" />
  //       Loading card payment form...
  //     </div>
  //   );
  // }

  const environment = getPayPalEnvironment();
  const providerProps = clientToken ? { clientToken } : { clientId };

  return (
    <PayPalProvider
      {...providerProps}
      components={['card-fields', 'paypal-payments']}
      pageType="checkout"
      environment={environment}
    >
      <PayPalSdkGate>
        <PayPalDepositCardCheckout {...props} />
      </PayPalSdkGate>
    </PayPalProvider>
  );
}
