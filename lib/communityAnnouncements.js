export function buildAnnouncementAudienceFilter(user) {
  const audienceMatch = ['all_users', user?.isVip ? 'vip_only' : 'non_vip_only'];
  return {
    audience: { $in: audienceMatch },
    $or: [
      { 'channels.inAppNotice': true },
      { 'channels.dashboardBanner': true },
      { channels: { $exists: false } },
    ],
  };
}
