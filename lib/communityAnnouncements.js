/**
 * @param {Record<string, unknown> | null | undefined} _user Reserved for future per-user rules.
 * @param {boolean} [executiveEventsAccess] Active tier has `executive_events` (VIP / executive announcements).
 */
export function buildAnnouncementAudienceFilter(_user, executiveEventsAccess = false) {
  const audienceMatch = ['all_users', executiveEventsAccess ? 'vip_only' : 'non_vip_only'];
  return {
    audience: { $in: audienceMatch },
    $or: [
      { 'channels.inAppNotice': true },
      { 'channels.dashboardBanner': true },
      { channels: { $exists: false } },
    ],
  };
}
