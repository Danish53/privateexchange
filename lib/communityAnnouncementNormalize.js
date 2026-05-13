const TYPES = [
    'drawing_launch',
    'drawing_result',
    'maintenance',
  // 'wallet_token',
  // 'membership',
  // 'security',
  // 'policy',
  'promotion',
  // 'general',
];
const AUDIENCES = ['all_users', 'vip_only', 'non_vip_only'];
const PRIORITIES = ['normal', 'high', 'critical'];

const DEFAULT_CHANNELS = {
  dashboardBanner: true,
  inAppNotice: true,
  emailNotice: false,
};

/**
 * Normalizes superadmin create/update body: minimal UI sends title, type, audience, details, startsAt (+ optional legacy fields).
 * @param {Record<string, unknown>} body
 * @returns {{ error: string } | { data: Record<string, unknown> }}
 */
export function normalizeSuperadminAnnouncementBody(body) {
  const title = String(body.title || '').trim();
  const type = String(body.type || 'general').trim();
  const audience = String(body.audience || 'all_users').trim();
  const priorityRaw = String(body.priority || 'normal').trim();
  const priority = PRIORITIES.includes(priorityRaw) ? priorityRaw : 'normal';
  const details = String(body.details || '').trim();
  let summary = String(body.summary || '').trim();
  if (!summary) {
    summary = details.slice(0, 280).trim() || title.slice(0, 280);
  }
  const startsAtRaw = String(body.startsAt || '').trim();
  const endsAtRaw = body.endsAt === null || body.endsAt === undefined ? '' : String(body.endsAt).trim();
  const ctaLabel = String(body?.cta?.label || '').trim();
  const ctaUrl = String(body?.cta?.url || '').trim();

  let channels = {
    dashboardBanner: Boolean(body?.channels?.dashboardBanner),
    inAppNotice: Boolean(body?.channels?.inAppNotice),
    emailNotice: Boolean(body?.channels?.emailNotice),
  };
  if (!channels.dashboardBanner && !channels.inAppNotice && !channels.emailNotice) {
    channels = { ...DEFAULT_CHANNELS };
  }

  if (!title || !details || !startsAtRaw) {
    return { error: 'Title, details, and event date are required.' };
  }
  if (!TYPES.includes(type)) {
    return { error: 'Invalid announcement type.' };
  }
  if (!AUDIENCES.includes(audience)) {
    return { error: 'Invalid audience type.' };
  }
  if ((ctaLabel && !ctaUrl) || (!ctaLabel && ctaUrl)) {
    return { error: 'Action label and action URL must both be set, or both left empty.' };
  }

  const startsAt = new Date(startsAtRaw);
  if (Number.isNaN(startsAt.getTime())) {
    return { error: 'Invalid event date.' };
  }
  let endsAt = null;
  if (endsAtRaw) {
    endsAt = new Date(endsAtRaw);
    if (Number.isNaN(endsAt.getTime()) || endsAt.getTime() <= startsAt.getTime()) {
      return { error: 'End date/time must be after the event date.' };
    }
  }

  return {
    data: {
      title,
      type,
      audience,
      priority,
      summary,
      details,
      startsAt,
      endsAt,
      cta: { label: ctaLabel, url: ctaUrl },
      channels,
    },
  };
}
