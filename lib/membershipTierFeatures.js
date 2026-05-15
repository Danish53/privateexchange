/** Display metadata for tier feature flags (API snake_case keys). Icons live in the UI component. */
export const MEMBERSHIP_TIER_FEATURE_DEFS = [
  {
    key: 'transfer_fee',
    label: 'Waived transfer fees',
    description: 'No transfer fees on this membership tier.',
    icon: 'transfer',
  },
  {
    key: 'vip_drawings',
    label: 'VIP drawings',
    description: 'Access to VIP-only drawings and campaigns.',
    icon: 'drawings',
  },
  {
    key: 'executive_events',
    label: 'Executive events',
    description: 'Invitations to executive-level events.',
    icon: 'events',
  },
  {
    key: 'priority_support',
    label: 'Priority support',
    description: 'Faster, prioritized member support.',
    icon: 'support',
  },
];

/**
 * @param {Record<string, unknown> | null | undefined} tier
 */
export function getMembershipTierFeatures(tier) {
  if (!tier) return [];
  return MEMBERSHIP_TIER_FEATURE_DEFS.filter((def) => Boolean(tier[def.key]));
}
