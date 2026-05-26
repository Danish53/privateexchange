'use client';

import { useEffect } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
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
const PAYPAL_MERCHANT_ID = process.env.NEXT_PUBLIC_PAYPAL_MERCHANT_ID || '';
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
  const { error: fieldsError } = usePayPalCardFields();
  const { submit, submitResponse, error: submitError } =
    usePayPalCardFieldsOneTimePaymentSession();

  useEffect(() => {
    if (fieldsError) {
      const msg =
        fieldsError?.message ||
        'PayPal card form failed to load. Enable Advanced Card Payments on your PayPal app.';
      setPaypalInlineError(msg);
      toast.error(msg, { title: 'PayPal Error' });
    }
  }, [fieldsError, setPaypalInlineError, toast]);

  useEffect(() => {
    if (submitError) {
      setProcessingPayment(false);
      const msg =
        submitError?.message ||
        'Card payment could not be submitted. Check sandbox test card or PayPal app settings.';
      setPaypalInlineError(msg);
      toast.error(msg, { title: 'PayPal Error' });
    }
  }, [submitError, setPaypalInlineError, setProcessingPayment, toast]);

  useEffect(() => {
    if (!submitResponse) return;

    const run = async () => {
      const { state, data } = submitResponse;
      const responseOrderId = String(data?.orderId || orderId || '');

      if (state === 'canceled') {
        setProcessingPayment(false);
        const msg = '3D Secure verification was cancelled.';
        setPaypalInlineError(msg);
        toast.info(msg, { title: 'Payment Cancelled' });
        return;
      }

      if (state === 'failed') {
        setProcessingPayment(false);
        const msg =
          data?.message ||
          `Card payment failed. Sandbox: Visa ${PAYPAL_SANDBOX_TEST_CARD.visa}, exp ${PAYPAL_SANDBOX_TEST_CARD.expiry}, CVV ${PAYPAL_SANDBOX_TEST_CARD.cvv}.`;
        setPaypalInlineError(msg);
        toast.error(msg, { title: 'PayPal Error' });
        return;
      }

      if (state !== 'succeeded') return;

      setPaypalStatusNote('Payment authorized. Securing funds to your wallet...');
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
        const msg = err.message || 'Capture failed.';
        setPaypalInlineError(msg);
        toast.error(msg, { title: 'PayPal Error' });
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
  ]);

  const handlePay = async () => {
    if (!orderId) {
      const msg = 'PayPal order is not ready. Please try again.';
      setPaypalInlineError(msg);
      toast.error(msg, { title: 'PayPal Error' });
      return;
    }
    setProcessingPayment(true);
    setPaypalInlineError('');
    setPaypalStatusNote('Authenticating card (3D Secure when required)...');
    try {
      await submit(orderId, {
        billingAddress: PAYPAL_BILLING_ADDRESS,
      });
    } catch (err) {
      setProcessingPayment(false);
      const msg = err?.message || 'Could not submit card payment.';
      setPaypalInlineError(msg);
      toast.error(msg, { title: 'PayPal Error' });
    }
  };

  return (
    <>
      <div className="paypal-deposit-card-fields mt-5 space-y-1 rounded-xl border border-blue-400/20 bg-black/20 p-4">
        <label className="mb-1 block text-xs uppercase tracking-[0.08em] text-blue-200/80">
          Card number
        </label>
        <PayPalCardNumberField
          placeholder="Card number"
          containerStyles={fieldContainerStyle}
          containerClassName="paypal-card-field-host"
          style={paypalCardFieldStyle}
        />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.08em] text-blue-200/80">
              Expiry
            </label>
            <PayPalCardExpiryField
              placeholder="MM / YY"
              containerStyles={fieldContainerStyle}
              containerClassName="paypal-card-field-host"
              style={paypalCardFieldStyle}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.08em] text-blue-200/80">
              CVV
            </label>
            <PayPalCardCvvField
              placeholder="CVV"
              containerStyles={fieldContainerStyle}
              containerClassName="paypal-card-field-host"
              style={paypalCardFieldStyle}
            />
          </div>
        </div>
        <p className="text-xs text-blue-200/70">
          Sandbox test card (copy exactly):{' '}
          <span className="font-mono text-blue-100">
            {formatPayPalTestCardDisplay(PAYPAL_SANDBOX_TEST_CARD.visa)}
          </span>
          {' · '}
          Exp <span className="font-mono">{PAYPAL_SANDBOX_TEST_CARD.expiry}</span>
          {' · '}
          CVV <span className="font-mono">{PAYPAL_SANDBOX_TEST_CARD.cvv}</span>
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
                Start new payment attempt
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
            Processing secure payment...
          </span>
        ) : (
          `Pay $${amountUsd} with card`
        )}
      </button>
    </>
  );
}

export default function PayPalCardPaymentForm(props) {
  const clientId = PAYPAL_CLIENT_ID;
  const environment = PAYPAL_ENV;

  if (!clientId) {
    return (
      <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
        PayPal is not configured. Set NEXT_PUBLIC_PAYPAL_CLIENT_ID on the server.
      </p>
    );
  }

  return (
    <PayPalProvider
      clientId={clientId}
      {...(PAYPAL_MERCHANT_ID ? { merchantId: PAYPAL_MERCHANT_ID } : {})}
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
