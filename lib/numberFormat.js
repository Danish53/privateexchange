export function formatNumberSmart(value, opts = {}) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '0';
  const {
    locale = undefined,
    minFractionDigits = 0,
    maxFractionDigits = 2,
  } = opts;
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: minFractionDigits,
    maximumFractionDigits: maxFractionDigits,
  }).format(num);
}

export function formatCurrencySmart(value, currency = 'USD', opts = {}) {
  const num = Number(value);
  if (!Number.isFinite(num)) return `${currency} 0`;
  const {
    locale = 'en-US',
    minFractionDigits = 0,
    maxFractionDigits = 2,
  } = opts;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: minFractionDigits,
    maximumFractionDigits: maxFractionDigits,
  }).format(num);
}
