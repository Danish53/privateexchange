import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { loadRequestActor } from '@/lib/authHelpers';
import MembershipTier from '@/lib/models/MembershipTier';
import { serializeMembershipTier } from '@/lib/membershipTierSerialize';
import {
  getUserMembershipAssignmentLean,
  syncAutomaticMembershipForUser,
} from '@/lib/userMembershipAssignmentService';
import { getWalletSummaryForUserId } from '@/lib/walletService';
import {
  getMemberMembershipEntitlements,
  serializeMembershipEntitlements,
} from '@/lib/membershipEntitlements';

export const runtime = 'nodejs';

/** Authenticated members: published tier catalogue + optional manual/automatic assignment for role `user`. */
export async function GET(request) {
  try {
    const auth = await loadRequestActor(request);
    if ('error' in auth) return auth.error;

    await connectDB();
    const rows = await MembershipTier.find({}).sort({ minValueUsd: 1, name: 1 }).limit(50).lean();
    const tiers = rows.map((r) => serializeMembershipTier(r));

    let assignment = null;
    if (auth.user?.role === 'user') {
      const summary = await getWalletSummaryForUserId(auth.userId);
      if (summary.ok) {
        try {
          await syncAutomaticMembershipForUser(auth.userId, { portfolioUsd: summary.portfolioUsd });
        } catch (e) {
          console.error('user/membership-overview syncAutomaticMembershipForUser', e);
        }
      }
      assignment = await getUserMembershipAssignmentLean(auth.userId);
    }

    let entitlements = null;
    if (auth.user?.role === 'user') {
      entitlements = serializeMembershipEntitlements(
        await getMemberMembershipEntitlements(auth.userId)
      );
    }

    return NextResponse.json({ ok: true, tiers, assignment, entitlements });
  } catch (e) {
    console.error('user/membership-overview GET', e);
    return NextResponse.json({ ok: false, error: 'Failed to load membership.' }, { status: 500 });
  }
}
