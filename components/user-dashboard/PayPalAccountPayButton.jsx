'use client';

import { useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import {
  PayPalProvider,
  PayPalOneTimePaymentButton,
  usePayPal,
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

/**
 * Credits USD via server capture — no PayPal webhook required.
 * Retries when PayPal order is not ready yet after approve.
 */
async function captureDepositWithRetries({
  depositId,
  orderId,
  authToken,
  maxAttempts = 5,
}) {
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
      lastError = new Error(json.error || 'Could not complete PayPal payment.');
      if (json.code !== 'PAYPAL_ORDER_NOT_READY') break;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error('Could not complete PayPal payment.');
}

function PayPalSdkGate({ children }) {
  const { loadingStatus, error, isHydrated } = usePayPal();

  if (!isHydrated || loadingStatus === INSTANCE_LOADING_STATE.PENDING) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-blue-300" />
      </div>
    );
  }

  if (loadingStatus === INSTANCE_LOADING_STATE.REJECTED || error) {
    return (
      <p className="text-center text-xs text-rose-300">
        {error?.message || 'PayPal button could not load.'}
      </p>
    );
  }

  return children;
}

function PayPalLoginSection({
  orderId,
  depositId,
  amountUsd,
  authToken,
  processingPayment,
  setProcessingPayment,
  setPaypalInlineError,
  setPaypalStatusNote,
  onPaymentComplete,
  toast,
}) {
  const handleApprove = useCallback(
    async (data) => {
      const approvedOrderId = String(data?.orderId || orderId || '');
      if (!approvedOrderId) {
        setPaypalInlineError('PayPal did not return an order id.');
        return;
      }
      setProcessingPayment(true);
      setPaypalStatusNote('Confirming payment and crediting USD to your wallet...');
      setPaypalInlineError('');
      try {
        const json = await captureDepositWithRetries({
          depositId,
          orderId: approvedOrderId,
          authToken,
        });
        setPaypalStatusNote('');
        onPaymentComplete(json);
      } catch (err) {
        const msg = err?.message || 'PayPal capture failed.';
        setPaypalInlineError(msg);
        toast.error(msg, { title: 'PayPal Error' });
      } finally {
        setProcessingPayment(false);
      }
    },
    [
      orderId,
      depositId,
      authToken,
      setProcessingPayment,
      setPaypalInlineError,
      setPaypalStatusNote,
      onPaymentComplete,
      toast,
    ]
  );

  return (
    <div className="mt-6 border-t border-white/15 pt-6">
      {/* <p className="text-center text-sm font-medium text-white">Or pay with PayPal</p> */}
      {/* <p className="mt-1 text-center text-xs text-blue-200/75">
        Opens PayPal to sign in — sandbox: use your <strong>Personal</strong> test buyer account
        (Developer Dashboard → Sandbox accounts).
      </p> */}
      <p className="mt-1 text-xs text-blue-200/60">
        Amount: ${Number(amountUsd).toFixed(2)} USD
      </p>
      <div className=" mt-4 max-w-md">
        <PayPalOneTimePaymentButton
          orderId={orderId}
          presentationMode="auto"
          disabled={processingPayment}
          onApprove={handleApprove}
          onError={(err) => {
            const msg = err?.message || 'PayPal payment failed.';
            setPaypalInlineError(msg);
            toast.error(msg, { title: 'PayPal Error' });
          }}
          onCancel={() => {
            setPaypalInlineError('PayPal login cancelled. You can try again.');
          }}
        />
      </div>
    </div>
  );
}

export default function PayPalAccountPayButton(props) {
  const clientId = getPayPalClientId();

  if (!clientId) return null;

  return (
    <PayPalProvider
      clientId={clientId}
      components={['paypal-payments']}
      pageType="checkout"
      environment={getPayPalEnvironment()}
    >
      <PayPalSdkGate>
        <PayPalLoginSection {...props} />
      </PayPalSdkGate>
    </PayPalProvider>
  );
}
