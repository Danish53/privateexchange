export function getSupportStatusLabel(status, t) {
  const key = `dashboard.support.statusLabels.${status}`;
  const label = t(key);
  return label === key ? String(status || '').replace(/_/g, ' ') : label;
}

export function getLedgerTypeLabel(type, t) {
  const key = `dashboard.common.ledgerTypes.${type}`;
  const label = t(key);
  return label === key ? String(type || '').replace(/_/g, ' ') : label;
}

export function getDrawingPrizeLine(draw, t) {
  const type = String(draw?.reward_type || '').toLowerCase();
  if (type === 'token' && draw?.reward_token_symbol) {
    return `${draw.reward_token_amount || '0'} ${draw.reward_token_symbol}`.trim();
  }
  if (draw?.prize_title) return draw.prize_title;
  if (type === 'event_access') return t('dashboard.drawings.eventAccess');
  if (type === 'physical') return t('dashboard.drawings.physicalPrize');
  if (type === 'custom') return draw.prize_title || t('dashboard.drawings.customReward');
  return t('dashboard.drawings.prize');
}
