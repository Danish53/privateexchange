export const DRAWING_AUDIENCES = ['all_users', 'vip_only', 'non_vip_only'];

/**
 * @param {string} raw
 * @returns {string | null}
 */
export function normalizeDrawingAudience(raw) {
  const v = String(raw || 'all_users').trim();
  return DRAWING_AUDIENCES.includes(v) ? v : null;
}

/**
 * Mongo filter: which drawing `audience` values this member may see.
 * @param {boolean} isVip
 */
export function buildDrawingAudienceFilter(isVip) {
  const audienceMatch = ['all_users', isVip ? 'vip_only' : 'non_vip_only'];
  return { audience: { $in: audienceMatch } };
}

/**
 * @param {{ audience?: string }} drawing
 * @param {{ hasAssignment?: boolean; isVip?: boolean; tierVipDrawingsEnabled?: boolean; vipDrawingsAccess?: boolean }} ent
 */
export function canMemberViewDrawing(drawing, ent) {
  const audience = String(drawing?.audience || 'all_users');
  // Open to every member — no VIP flag or membership tier required.
  if (audience === 'all_users') return true;
  if (!ent?.hasAssignment || !ent?.tierVipDrawingsEnabled) {
    return false;
  }
  if (audience === 'vip_only') return Boolean(ent.vipDrawingsAccess);
  if (audience === 'non_vip_only') return !ent.isVip;
  return false;
}
