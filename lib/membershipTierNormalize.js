/**
 * @param {unknown} body
 * @param {string} camelKey
 * @param {string} snakeKey
 * @param {boolean} [defaultValue]
 */
function boolFromBody(body, camelKey, snakeKey, defaultValue = false) {
  const raw = body?.[camelKey] ?? body?.[snakeKey];
  if (typeof raw === 'boolean') return raw;
  if (raw === 'true' || raw === 1 || raw === '1') return true;
  if (raw === 'false' || raw === 0 || raw === '0') return false;
  if (raw == null || raw === '') return defaultValue;
  return Boolean(raw);
}

/**
 * @param {unknown} body
 * @returns {{ error: string } | { data: { name: string; minValueUsd: number; benefits: string[]; transferFee: boolean; vipDrawings: boolean; executiveEvents: boolean; prioritySupport: boolean } }}
 */
export function normalizeTierBody(body) {
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  if (!name) return { error: 'Name is required.' };
  if (name.length > 120) return { error: 'Name is too long.' };

  const rawMin = body?.minValueUsd ?? body?.min_value_usd;
  const minValueUsd = typeof rawMin === 'string' ? Number.parseFloat(rawMin.replace(/,/g, '')) : Number(rawMin);
  if (!Number.isFinite(minValueUsd) || minValueUsd < 0) {
    return { error: 'Minimum value (USD) must be a number zero or greater.' };
  }

  let benefitsRaw = body?.benefits;
  if (!Array.isArray(benefitsRaw) && typeof body?.benefit === 'string') {
    benefitsRaw = [body.benefit];
  }
  if (!Array.isArray(benefitsRaw)) {
    return { error: 'Benefits must be a non-empty list.' };
  }
  const benefits = benefitsRaw
    .map((b) => (typeof b === 'string' ? b.trim() : String(b ?? '').trim()))
    .filter(Boolean)
    .slice(0, 40);
  if (benefits.length === 0) return { error: 'Add at least one benefit.' };
  for (const b of benefits) {
    if (b.length > 500) return { error: 'Each benefit must be 500 characters or less.' };
  }

  const transferFee = boolFromBody(body, 'transferFee', 'transfer_fee', false);
  const vipDrawings = boolFromBody(body, 'vipDrawings', 'vip_drawings', false);
  const executiveEvents = boolFromBody(body, 'executiveEvents', 'executive_events', false);
  const prioritySupport = boolFromBody(body, 'prioritySupport', 'priority_support', false);

  return {
    data: {
      name,
      minValueUsd,
      benefits,
      transferFee,
      vipDrawings,
      executiveEvents,
      prioritySupport,
    },
  };
}
