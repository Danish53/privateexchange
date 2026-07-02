'use client';

import { useEffect } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { useWebsiteT } from '@/components/i18n/WebsiteLocaleProvider';
import {
  PAYPAL_SANDBOX_TEST_CARD,
  formatPayPalTestCardDisplay,
} from '@/lib/paypalSandboxTestCards';
import {
  PayPalProvider,
  PayPalCardFieldsProvider,
  PayPalCardNumberField,
  PayPalCardExpiryField,
  PayPalCardCvvField,
  usePayPalCardFields,
  usePayPalCardFieldsOneTimePaymentSession,
} from '@paypal/react-paypal-js/sdk-v6';

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '';
/** Only pass if it looks like a real PayPal merchant id (not a placeholder). */
function getPayPalMerchantId() {
  const id = String(process.env.NEXT_PUBLIC_PAYPAL_MERCHANT_ID || '').trim();
  if (!id || id.length < 10 || id.length > 32) return '';
  return id;
}
const PAYPAL_ENV =
  process.env.NEXT_PUBLIC_PAYPAL_ENVIRONMENT === 'production' ? 'production' : 'sandbox';

const PAYPAL_BILLING_ADDRESS = {
  addressLine1: '123 Main St',
  adminArea2: 'New York',
  adminArea1: 'NY',
  postalCode: '10001',
  countryCode: 'US',
};

async function captureWithRetries({ depositId, orderId, authToken, maxAttempts = 4 }) {
  let lastError = null;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, 1200 * attempt));
    }
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
      lastError = new Error(json.error || 'Could not complete PayPal deposit.');
      if (json.code === 'PAYER_CANNOT_PAY') break;
      if (json.code === 'PAYPAL_3DS_REQUIRED') break;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error('Could not complete PayPal deposit.');
}

/** Transparent inputs to match dark deposit UI (Stripe-style). */
const paypalCardFieldStyle = {
  input: {
    color: '#ffffff',
    'font-size': '15px',
    'font-family': 'inherit',
    'background-color': 'transparent',
  },
  '::placeholder': {
    color: 'rgba(255, 255, 255, 0.45)',
  },
  body: {
    'background-color': 'transparent',
  },
  '.invalid': {
    color: '#fda4af',
  },
};

const fieldContainerStyle = {
  height: '2.75rem',
  marginBottom: '0.75rem',
  borderRadius: '0.5rem',
  border: '1px solid rgba(255,255,255,0.15)',
  backgroundColor: 'transparent',
  overflow: 'hidden',
};

function PayPalCardFieldsInner({
  orderId,
  depositId,
  amountUsd,
  authToken,
  processingPayment,
  setProcessingPayment,
  paypalInlineError,
  setPaypalInlineError,
  setPaypalStatusNote,
  onPaymentComplete,
  onRetry,
  toast,
}) {
  const { t } = useWebsiteT();
  const { error: fieldsError } = usePayPalCardFields();
  const { submit, submitResponse, error: submitError } =
    usePayPalCardFieldsOneTimePaymentSession();

  useEffect(() => {
    if (fieldsError) {
      const msg =
        fieldsError?.message || t('dashboard.paypal.cardFormFailed');
      setPaypalInlineError(msg);
      toast.error(msg, { title: t('dashboard.deposit.paymentErrorTitle') });
    }
  }, [fieldsError, setPaypalInlineError, toast, t]);

  useEffect(() => {
    if (submitError) {
      setProcessingPayment(false);
      const msg =
        submitError?.message || t('dashboard.paypal.cardSubmitSandbox');
      setPaypalInlineError(msg);
      toast.error(msg, { title: t('dashboard.deposit.paymentErrorTitle') });
    }
  }, [submitError, setPaypalInlineError, setProcessingPayment, toast, t]);

  useEffect(() => {
    if (!submitResponse) return;

    const run = async () => {
      const { state, data } = submitResponse;
      const responseOrderId = String(data?.orderId || orderId || '');

      if (state === 'canceled') {
        setProcessingPayment(false);
        const msg = t('dashboard.paypal.cancelled3dsShort');
        setPaypalInlineError(msg);
        toast.info(msg, { title: t('dashboard.paypal.cancelled') });
        return;
      }

      if (state === 'failed') {
        setProcessingPayment(false);
        const msg =
          data?.message ||
          t('dashboard.paypal.cardFailedSandbox', {
            card: PAYPAL_SANDBOX_TEST_CARD.visa,
            expiry: PAYPAL_SANDBOX_TEST_CARD.expiry,
            cvc: PAYPAL_SANDBOX_TEST_CARD.cvv,
          });
        setPaypalInlineError(msg);
        toast.error(msg, { title: t('dashboard.deposit.paymentErrorTitle') });
        return;
      }

      if (state !== 'succeeded') return;

      setPaypalStatusNote(t('dashboard.paypal.securingWallet'));
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
        const msg = err.message || t('dashboard.paypal.error');
        setPaypalInlineError(msg);
        toast.error(msg, { title: t('dashboard.deposit.paymentErrorTitle') });
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
    toast,
    t,
  ]);

  const handlePay = async () => {
    if (!orderId) {
      const msg = t('dashboard.paypal.orderNotReady');
      setPaypalInlineError(msg);
      toast.error(msg, { title: t('dashboard.deposit.paymentErrorTitle') });
      return;
    }
    setProcessingPayment(true);
    setPaypalInlineError('');
    setPaypalStatusNote(t('dashboard.paypal.authCard3ds'));
    try {
      await submit(orderId, {
        billingAddress: PAYPAL_BILLING_ADDRESS,
      });
    } catch (err) {
      setProcessingPayment(false);
      const msg = err?.message || t('dashboard.paypal.couldNotSubmitCard');
      setPaypalInlineError(msg);
      toast.error(msg, { title: t('dashboard.deposit.paymentErrorTitle') });
    }
  };

  return (
    <>
      <div className="paypal-deposit-card-fields mt-5 space-y-1 rounded-xl border border-blue-400/20 bg-black/20 p-4">
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
        <p className="text-xs text-blue-200/70">
          {t('dashboard.paypal.sandboxTestCard', {
            card: formatPayPalTestCardDisplay(PAYPAL_SANDBOX_TEST_CARD.visa),
            expiry: PAYPAL_SANDBOX_TEST_CARD.expiry,
            cvc: PAYPAL_SANDBOX_TEST_CARD.cvv,
          })}
        </p>
        {paypalInlineError ? (
          <div className="space-y-2">
            <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
              {paypalInlineError}
            </p>
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
        ) : null}
      </div>

      <button
        type="button"
        onClick={handlePay}
        disabled={processingPayment}
        className="mt-4 w-full rounded-xl bg-blue-600 py-4 text-lg font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {processingPayment ? (
          <span className="inline-flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            {t('dashboard.paypal.processing')}
          </span>
        ) : (
          t('dashboard.paypal.payWithCardAmount', { amount: `$${amountUsd}` })
        )}
      </button>
    </>
  );
}

export default function PayPalCardPaymentForm(props) {
  const { t } = useWebsiteT();
  const clientId = PAYPAL_CLIENT_ID;
  const environment = PAYPAL_ENV;

  if (!clientId) {
    return (
      <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
        {t('dashboard.paypal.notConfiguredServer')}
      </p>
    );
  }

  return (
    <PayPalProvider
      clientId={clientId}
      {...(getPayPalMerchantId() ? { merchantId: getPayPalMerchantId() } : {})}
      components={['card-fields']}
      pageType="checkout"
      environment={environment}
    >
      <PayPalCardFieldsProvider>
        <PayPalCardFieldsInner {...props} />
      </PayPalCardFieldsProvider>
    </PayPalProvider>
  );
}
