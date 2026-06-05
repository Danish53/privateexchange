/**
 * Turn PayPal SDK / API errors into short messages for the deposit UI.
 */
export function formatPayPalUserError(err, fallback = 'Payment could not be completed. Please try again.') {
  if (!err) return fallback;

  if (typeof err === 'string') {
    return parsePayPalErrorString(err) || err || fallback;
  }

  if (isPayPalDevError(err)) {
    return (
      'Card payment on this page is not available for your PayPal setup yet. ' +
      'Use “Pay with PayPal account” below, or try again later.'
    );
  }

  const msg = String(err?.message || err?.name || '').trim();
  if (msg) {
    const parsed = parsePayPalErrorString(msg);
    if (parsed) return parsed;
    if (!msg.startsWith('{')) return msg;
  }

  try {
    const raw = JSON.stringify(err);
    const parsed = parsePayPalErrorString(raw);
    if (parsed) return parsed;
  } catch {
    /* ignore */
  }

  return fallback;
}

function isPayPalDevError(err) {
  const raw = typeof err === 'string' ? err : JSON.stringify(err);
  const text = String(err?.message || err?.name || err?.code || raw || '');
  return (
    text.includes('ERR_DEV') ||
    text.includes('DevError') ||
    text.includes('ERR_DEV_RECEIVED_CLIENT_ERROR_RESPONSE')
  );
}

function parsePayPalErrorString(text) {
  const s = String(text || '').trim();
  if (!s) return '';

  if (s.includes('PAYER_CANNOT_PAY')) {
    return (
      'PayPal could not process this card payment. Try the sandbox test card (4012888888881881, 12/30, 123), complete bank verification if asked, or pay with the PayPal account button below.'
    );
  }

  if (s.includes('ERR_DEV_RECEIVED_CLIENT_ERROR_RESPONSE') || s.includes('DevError')) {
    return (
      'Card fields could not connect to PayPal. Use the PayPal account button below, or enter card details again after refreshing the page.'
    );
  }

  if (s.startsWith('{')) {
    try {
      const obj = JSON.parse(s);
      if (obj?.code === 'ERR_DEV_RECEIVED_CLIENT_ERROR_RESPONSE' || obj?.name === 'DevError') {
        return (
          'Card fields could not connect to PayPal. Use the PayPal account button below.'
        );
      }
      if (obj?.message && typeof obj.message === 'string') return obj.message;
      if (obj?.error && typeof obj.error === 'string') return obj.error;
    } catch {
      /* not JSON */
    }
  }

  return '';
}
