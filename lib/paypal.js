function getEnv(name) {
  return String(process.env[name] || '').trim();
}

export function isPayPalConfigured() {
  return Boolean(getEnv('PAYPAL_CLIENT_ID') && getEnv('PAYPAL_CLIENT_SECRET'));
}

export function getPayPalPublicClientId() {
  return getEnv('NEXT_PUBLIC_PAYPAL_CLIENT_ID') || getEnv('PAYPAL_CLIENT_ID');
}

export function getPayPalEnvironment() {
  const explicit = getEnv('PAYPAL_ENVIRONMENT').toLowerCase();
  if (explicit === 'production' || explicit === 'live') return 'production';
  if (explicit === 'sandbox') return 'sandbox';
  const base = getPayPalApiBase();
  return base.includes('sandbox') ? 'sandbox' : 'production';
}

export function getPayPalApiBase() {
  const override = getEnv('PAYPAL_API_BASE');
  if (override) return override.replace(/\/$/, '');
  const env = getEnv('PAYPAL_ENVIRONMENT').toLowerCase();
  if (env === 'production' || env === 'live') return 'https://api-m.paypal.com';
  return 'https://api-m.sandbox.paypal.com';
}

let cachedToken = null;
let cachedTokenExpiresAt = 0;

async function getAccessToken() {
  const clientId = getEnv('PAYPAL_CLIENT_ID');
  const secret = getEnv('PAYPAL_CLIENT_SECRET');
  if (!clientId || !secret) {
    throw new Error('PayPal credentials are not configured.');
  }

  if (cachedToken && Date.now() < cachedTokenExpiresAt - 30_000) {
    return cachedToken;
  }

  const auth = Buffer.from(`${clientId}:${secret}`).toString('base64');
  const res = await fetch(`${getPayPalApiBase()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error_description || data?.message || 'PayPal authentication failed.');
  }

  cachedToken = String(data.access_token || '');
  const expiresIn = Number(data.expires_in) || 300;
  cachedTokenExpiresAt = Date.now() + expiresIn * 1000;
  if (!cachedToken) throw new Error('PayPal authentication returned no token.');
  return cachedToken;
}

export async function paypalApi(path, { method = 'GET', body } = {}) {
  const token = await getAccessToken();
  const res = await fetch(`${getPayPalApiBase()}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body != null ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail =
      data?.details?.[0]?.description ||
      data?.details?.[0]?.issue ||
      data?.message ||
      data?.error_description ||
      'PayPal request failed.';
    const err = new Error(detail);
    err.statusCode = res.status;
    err.paypal = data;
    throw err;
  }
  return data;
}

export function formatPayPalAmount(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) throw new Error('Invalid amount.');
  return n.toFixed(2);
}

/** PayPal generate-token: customer_id max 22 chars. */
export function normalizePayPalCustomerId(customerId) {
  const cleaned =
    String(customerId || '')
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, '') || 'guest';
  return cleaned.length <= 22 ? cleaned : cleaned.slice(0, 22);
}

/** PayPal generate-token returns a browser client token (often one segment, not a 3-part JWT). */
export function isPayPalClientToken(token) {
  const t = String(token || '').trim();
  if (t.length < 50) return false;
  return /^[A-Za-z0-9._-]+$/.test(t);
}

/** @deprecated Use isPayPalClientToken */
export function isPayPalClientJwt(token) {
  return isPayPalClientToken(token);
}

/** Server-side client token for PayPal JS SDK v6 card-fields. */
export async function generatePayPalClientToken(customerId = 'guest') {
  const id = normalizePayPalCustomerId(customerId);
  const token = await getAccessToken();
  const res = await fetch(`${getPayPalApiBase()}/v1/identity/generate-token`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept-Language': 'en_US',
    },
    body: JSON.stringify({ customer_id: id }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail =
      data?.details?.[0]?.description ||
      data?.message ||
      data?.error_description ||
      'PayPal client token request failed.';
    const err = new Error(detail);
    err.statusCode = res.status;
    err.paypal = data;
    throw err;
  }
  const clientToken = String(data?.client_token || data?.clientToken || '').trim();
  if (!isPayPalClientToken(clientToken)) {
    throw new Error('PayPal returned an empty or invalid client token.');
  }
  return { clientToken, expiresIn: Number(data?.expires_in) || 3600 };
}

/**
 * Create a PayPal order for embedded card checkout (3DS handled on submit).
 */
export async function getPayPalOrder(orderId) {
  return paypalApi(`/v2/checkout/orders/${encodeURIComponent(orderId)}`, { method: 'GET' });
}

export function extractCaptureFromOrder(order) {
  const capture = order?.purchase_units?.[0]?.payments?.captures?.[0] || null;
  return {
    captureId: String(capture?.id || ''),
    status: String(capture?.status || order?.status || '').toUpperCase(),
    orderStatus: String(order?.status || '').toUpperCase(),
    processorCode: String(capture?.processor_response?.response_code || ''),
  };
}

export const PAYPAL_SANDBOX_SETUP_HINT =
  'PayPal sandbox: Developer Dashboard → Apps & Credentials → your Sandbox REST app → Features → enable "Advanced Credit and Debit Card Payments" → Save. Log into sandbox.paypal.com with your business test account and finish any payment setup prompts. Use card 4012888888881881, exp 12/30, CVV 123.';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isPayPalIssue(err, issueCode) {
  const code = String(issueCode || '').toUpperCase();
  const details = err?.paypal?.details;
  if (Array.isArray(details)) {
    return details.some((d) => String(d?.issue || '').toUpperCase() === code);
  }
  return String(err?.paypal?.name || '').includes(code);
}

export async function waitForPayPalOrderStatus(
  orderId,
  targetStatuses,
  { attempts = 12, intervalMs = 800 } = {}
) {
  const targets = new Set(targetStatuses.map((s) => String(s).toUpperCase()));
  let last = null;

  for (let i = 0; i < attempts; i += 1) {
    last = await getPayPalOrder(orderId);
    const status = String(last?.status || '').toUpperCase();
    if (targets.has(status)) return last;
    if (status === 'VOIDED') break;
    if (i < attempts - 1) await sleep(intervalMs);
  }

  return last;
}

/**
 * Poll order, capture when needed, or use an existing COMPLETED capture.
 */
export async function finalizePayPalDepositOrder(orderId) {
  let order = await waitForPayPalOrderStatus(orderId, [
    'COMPLETED',
    'APPROVED',
    'PAYER_ACTION_REQUIRED',
  ]);

  let status = String(order?.status || '').toUpperCase();

  if (status === 'PAYER_ACTION_REQUIRED') {
    const err = new Error(
      'Complete 3D Secure verification in the bank popup, then press Pay again or start a new payment attempt.'
    );
    err.code = 'PAYPAL_3DS_REQUIRED';
    throw err;
  }

  if (status === 'COMPLETED') {
    const info = extractCaptureFromOrder(order);
    if (info.status === 'DECLINED') {
      const err = new Error('Card was declined by PayPal. Try another sandbox test card.');
      err.code = 'PAYPAL_DECLINED';
      throw err;
    }
    return { order, captureInfo: info };
  }

  if (status === 'APPROVED') {
    try {
      const captured = await capturePayPalOrder(orderId);
      return { order: captured, captureInfo: extractCaptureFromOrder(captured) };
    } catch (captureErr) {
      if (isPayPalIssue(captureErr, 'PAYER_CANNOT_PAY')) {
        order = await getPayPalOrder(orderId);
        status = String(order?.status || '').toUpperCase();
        const info = extractCaptureFromOrder(order);
        if (status === 'COMPLETED' && (info.status === 'COMPLETED' || info.captureId)) {
          return { order, captureInfo: info };
        }
        const err = new Error(
          mapPayPalIssueToMessage(
            'PAYER_CANNOT_PAY',
            'Payer cannot pay for this transaction with the current card or account setup.'
          )
        );
        err.code = 'PAYER_CANNOT_PAY';
        err.paypal = captureErr.paypal;
        throw err;
      }
      throw captureErr;
    }
  }

  if (status === 'CREATED') {
    const err = new Error(
      'PayPal payment is still processing. Wait a moment — we will retry automatically.'
    );
    err.code = 'PAYPAL_ORDER_NOT_READY';
    throw err;
  }

  const err = new Error(`PayPal payment is not ready (status: ${status || 'unknown'}).`);
  err.code = 'PAYPAL_ORDER_NOT_READY';
  throw err;
}

export async function createPayPalDepositOrder({ amount, depositId }) {
  const value = formatPayPalAmount(amount);

  const data = await paypalApi('/v2/checkout/orders', {
    method: 'POST',
    body: {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: `deposit_${depositId}`,
          amount: {
            currency_code: 'USD',
            value,
            breakdown: {
              item_total: { currency_code: 'USD', value },
            },
          },
          custom_id: String(depositId),
          description: `USD wallet deposit (${value})`,
          items: [
            {
              name: 'Wallet Deposit',
              description: 'USD balance credit',
              quantity: '1',
              unit_amount: { currency_code: 'USD', value },
              category: 'DIGITAL_GOODS',
            },
          ],
        },
      ],
    },
  });

  const orderId = String(data?.id || '');
  if (!orderId) throw new Error('PayPal did not return an order id.');
  return { orderId, status: String(data?.status || ''), raw: data };
}

/**
 * Capture a PayPal order after card approval / 3DS.
 */
export async function capturePayPalOrder(orderId) {
  const data = await paypalApi(`/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
    method: 'POST',
    body: {},
  });
  return data;
}

export function mapPayPalIssueToMessage(issue, description) {
  const code = String(issue || '').toUpperCase();
  const map = {
    INSTRUMENT_DECLINED: 'Your card was declined. Try another card or contact your bank.',
    PAYER_CANNOT_PAY:
      'PayPal could not charge this card (PAYER_CANNOT_PAY). Sandbox: use Visa 4012888888881881, exp 12/30, CVV 123, finish 3D Secure if prompted, and ensure Advanced Card is enabled on your REST app. Or use Pay with PayPal account below.',
    PAYMENT_DENIED: 'Payment was denied. Please try again or use a different card.',
    TRANSACTION_REFUSED: 'Transaction refused by the card issuer.',
    CARD_EXPIRED: 'This card has expired.',
    INVALID_SECURITY_CODE: 'The security code (CVV) is incorrect.',
    INVALID_ACCOUNT_STATUS: 'PayPal account is not ready to accept payments.',
  };
  if (map[code]) return map[code];
  if (description) return String(description);
  return 'Card payment failed. Please check your details and try again.';
}

export function extractPayPalErrorMessage(err) {
  const details = err?.paypal?.details;
  if (Array.isArray(details) && details.length) {
    return mapPayPalIssueToMessage(details[0]?.issue, details[0]?.description);
  }
  const issue = err?.issue || err?.name;
  if (issue) {
    return mapPayPalIssueToMessage(issue, err?.message || err?.description);
  }
  return err?.message || 'PayPal payment failed.';
}

export function assertPayPalEnvironmentMatch() {
  const pub = getEnv('NEXT_PUBLIC_PAYPAL_ENVIRONMENT').toLowerCase();
  const server = getEnv('PAYPAL_ENVIRONMENT').toLowerCase();
  if (!pub || !server) return;
  const pubProd = pub === 'production' || pub === 'live';
  const srvProd = server === 'production' || server === 'live';
  if (pubProd !== srvProd) {
    throw new Error(
      'PayPal environment mismatch: NEXT_PUBLIC_PAYPAL_ENVIRONMENT and PAYPAL_ENVIRONMENT must both be sandbox or both be production.'
    );
  }
}
