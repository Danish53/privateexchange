/**
 * PayPal Sandbox — Expanded Checkout / Advanced Card Fields test cards.
 * @see https://developer.paypal.com/tools/sandbox/card-testing/
 */
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
