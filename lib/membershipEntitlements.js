import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import UserMembershipAssignment from '@/lib/models/UserMembershipAssignment';

const EMPTY = {
  hasAssignment: false,
  isVip: false,
  tierVipDrawingsEnabled: false,
  transferFeeWaived: false,
  vipDrawingsAccess: false,
  executiveEventsAccess: false,
  prioritySupport: false,
  tierId: null,
  tierName: '',
  tierSlug: '',
};

/**
 * Effective feature access: tier flag on the active plan **and** `User.isVip` (set when tier reaches
 * the first step above entry). Entry/basic tier may list features in admin, but they stay off until VIP.
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @returns {Promise<typeof EMPTY & { hasAssignment: boolean; isVip: boolean; tierId: string | null; tierName: string; tierSlug: string }>}
 */
export async function getMemberMembershipEntitlements(userId) {
  await connectDB();
  if (!mongoose.isValidObjectId(String(userId))) {
    return { ...EMPTY };
  }

  const user = await User.findById(userId).select('isVip role').lean();
  if (!user || user.role !== 'user') {
    return { ...EMPTY };
  }

  const isVip = Boolean(user.isVip);

  const row = await UserMembershipAssignment.findOne({ user: userId })
    .populate('membershipTier', 'name slug transferFee vipDrawings executiveEvents prioritySupport')
    .lean();

  const tier = row?.membershipTier;
  if (!tier) {
    return { ...EMPTY, isVip };
  }

  const tierTransferFee = Boolean(tier.transferFee);
  const tierVipDrawings = Boolean(tier.vipDrawings);
  const tierExecutiveEvents = Boolean(tier.executiveEvents);
  const tierPrioritySupport = Boolean(tier.prioritySupport);

  return {
    hasAssignment: true,
    isVip,
    tierVipDrawingsEnabled: tierVipDrawings,
    transferFeeWaived: isVip && tierTransferFee,
    vipDrawingsAccess: isVip && tierVipDrawings,
    executiveEventsAccess: isVip && tierExecutiveEvents,
    prioritySupport: isVip && tierPrioritySupport,
    tierId: String(tier._id),
    tierName: tier.name || '',
    tierSlug: tier.slug || '',
  };
}

/** @param {Awaited<ReturnType<typeof getMemberMembershipEntitlements>>} ent */
const VIP_DRAWINGS_DENIED = {
  ok: false,
  error: 'VIP drawings are not included in your current membership plan.',
  code: 'VIP_DRAWINGS_REQUIRED',
};

/**
 * @param {import('next/server').NextResponse} NextResponse
 * @param {Awaited<ReturnType<typeof getMemberMembershipEntitlements>>} entitlements
 */
/**
 * @param {{ audience?: string }} [drawing]
 */
export function vipDrawingsDeniedResponse(NextResponse, entitlements, drawing = null) {
  const audience = drawing ? String(drawing.audience || 'all_users') : 'vip_only';
  if (audience === 'all_users') {
    return null;
  }
  if (audience === 'non_vip_only') {
    if (entitlements.tierVipDrawingsEnabled && !entitlements.isVip) return null;
  } else if (entitlements.vipDrawingsAccess) {
    return null;
  }
  return NextResponse.json(VIP_DRAWINGS_DENIED, { status: 403 });
}

export function serializeMembershipEntitlements(ent) {
  return {
    is_vip: Boolean(ent?.isVip),
    transfer_fee: Boolean(ent?.transferFeeWaived),
    vip_drawings: Boolean(ent?.vipDrawingsAccess),
    executive_events: Boolean(ent?.executiveEventsAccess),
    priority_support: Boolean(ent?.prioritySupport),
    has_assignment: Boolean(ent?.hasAssignment),
    tier_id: ent?.tierId || null,
    tier_name: ent?.tierName || '',
    tier_slug: ent?.tierSlug || '',
  };
}
