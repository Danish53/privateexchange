import crypto from 'crypto';

const NOWPAYMENTS_API_BASE = 'https://api.nowpayments.io/v1';

function getEnv(name) {
  return String(process.env[name] || '').trim();
}

export function isNowPaymentsConfigured() {
  return Boolean(getEnv('NOWPAYMENTS_API_KEY') && getEnv('NOWPAYMENTS_IPN_SECRET'));
}

export function verifyNowPaymentsIpnSignature(rawBody, signature) {
  const secret = getEnv('NOWPAYMENTS_IPN_SECRET');
  if (!secret || !signature) return false;
  const expected = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');
  return expected.toLowerCase() === String(signature).toLowerCase();
}

export async function createNowPaymentsPayment({
  priceAmount,
  priceCurrency = 'usd',
  payCurrency,
  orderId,
  orderDescription,
}) {
  const apiKey = getEnv('NOWPAYMENTS_API_KEY');
  if (!apiKey) {
    throw new Error('NOWPAYMENTS_API_KEY is missing.');
  }

  const payload = {
    price_amount: priceAmount,
    price_currency: String(priceCurrency).toLowerCase(),
    pay_currency: String(payCurrency || '').toLowerCase(),
    order_id: String(orderId),
    order_description: String(orderDescription || 'Wallet deposit'),
    ipn_callback_url: getEnv('NOWPAYMENTS_IPN_CALLBACK_URL') || undefined,
  };

  const res = await fetch(`${NOWPAYMENTS_API_BASE}/payment`, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.message || json?.error || 'Failed to create NowPayments payment.';
    throw new Error(msg);
  }
  return json;
}

export async function getNowPaymentsMinAmount({
  currencyFrom = 'usd',
  currencyTo,
}) {
  const apiKey = getEnv('NOWPAYMENTS_API_KEY');
  if (!apiKey) {
    throw new Error('NOWPAYMENTS_API_KEY is missing.');
  }
  if (!currencyTo || typeof currencyTo !== 'string') {
    throw new Error('currencyTo is required to fetch min amount.');
  }

  const from = String(currencyFrom).toLowerCase();
  const to = String(currencyTo).toLowerCase();
  const url = `${NOWPAYMENTS_API_BASE}/min-amount?currency_from=${encodeURIComponent(from)}&currency_to=${encodeURIComponent(to)}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.message || json?.error || 'Failed to fetch NowPayments min amount.';
    throw new Error(msg);
  }

  const minAmount = Number(json?.min_amount);
  if (!Number.isFinite(minAmount)) {
    throw new Error('NowPayments min amount response is invalid.');
  }

  return minAmount;
}
