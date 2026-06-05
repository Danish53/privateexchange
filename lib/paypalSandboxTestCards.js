/**
 * PayPal Sandbox — Expanded Checkout / Advanced Card Fields test cards.
 * @see https://developer.paypal.com/tools/sandbox/card-testing/
 */
export const PAYPAL_ADVANCED_CARD_SETUP_STEPS = [
  'Open developer.paypal.com → Dashboard → Sandbox (or Live) → Apps & Credentials → your REST app.',
  'Features → Accept payments → enable "Advanced Credit and Debit Card Payments" → Save.',
  'Log into sandbox.paypal.com with your Business sandbox account and complete any payment onboarding prompts.',
  'Restart npm run dev, hard-refresh the deposit page, then try again.',
];

export const PAYPAL_SANDBOX_SETUP_HINT =
  'PayPal DevError: enable Advanced Credit and Debit Card Payments on your REST app (see steps on screen). Until then use the PayPal account button. Sandbox card: 4012888888881881, exp 12/30, CVV 123.';

export const PAYPAL_SANDBOX_TEST_CARD = {
  /** Primary Visa (PayPal docs example for Expanded Checkout) */
  visa: '4012888888881881',
  visaAlt: '4012000033330026',
  mastercard: '5555555555554444',
  /** Future expiry — any future MM/YY works in sandbox */
  expiry: '12/30',
  cvv: '123',
};

export function formatPayPalTestCardDisplay(number) {
  const digits = String(number || '').replace(/\D/g, '');
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}
