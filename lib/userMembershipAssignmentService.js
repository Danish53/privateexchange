import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import MembershipTier from '@/lib/models/MembershipTier';
import User from '@/lib/models/User';
import UserMembershipAssignment from '@/lib/models/UserMembershipAssignment';
import { getWalletSummaryForUserId } from '@/lib/walletService';

/**
 * Highest tier the portfolio amount qualifies for (largest `minValueUsd` with portfolioUsd >= min).
 * @param {number} portfolioUsd
 * @param {Array<{ _id: unknown; minValueUsd?: number; name?: string }>} tiersSorted Ascending by minValueUsd, then name.
 * @returns {Record<string, unknown> | null}
 */
function pickQualifiedTierForPortfolio(portfolioUsd, tiersSorted) {
  let qualified = null;
  let bestMin = -Infinity;
  for (const tier of tiersSorted) {
    const minV = Number(tier.minValueUsd) || 0;
    if (portfolioUsd >= minV && minV >= bestMin) {
      qualified = tier;
      bestMin = minV;
    }
  }
  return qualified;
}

/**
 * First tier strictly above the entry (lowest) `minValueUsd`. Crossing this threshold sets `isVip`.
 * @param {Array<{ minValueUsd?: number }>} tiersSorted
 * @returns {Record<string, unknown> | null}
 */
function firstTierAboveEntry(tiersSorted) {
  if (!tiersSorted.length) return null;
  const entryMin = Number(tiersSorted[0].minValueUsd) || 0;
  return tiersSorted.find((t) => (Number(t.minValueUsd) || 0) > entryMin) || null;
}

/**
 * Sets `User.isVip` when the assigned tier is at or above the first tier above entry (lowest `minValueUsd`).
 * Used for **automatic** and **manual** membership assignment. Only sets `true`, never clears.
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {Record<string, unknown> | null} assignedTier Lean tier with `minValueUsd`
 * @param {Array<Record<string, unknown>> | null | undefined} [tiersSortedOptional] Preloaded tiers (asc by minValueUsd, name) to skip an extra query
 */
export async function applyIsVipWhenPastEntryTier(userId, assignedTier, tiersSortedOptional) {
  await connectDB();
  if (!mongoose.isValidObjectId(String(userId)) || !assignedTier) return;
  const uid = new mongoose.Types.ObjectId(String(userId));
  const tiers =
    Array.isArray(tiersSortedOptional) && tiersSortedOptional.length > 0
      ? tiersSortedOptional
      : await MembershipTier.find({}).sort({ minValueUsd: 1, name: 1 }).limit(50).lean();
  if (!tiers.length) return;
  const nextAfterEntry = firstTierAboveEntry(tiers);
  if (!nextAfterEntry) return;
  const assignedMin = Number(assignedTier.minValueUsd) || 0;
  const nextMin = Number(nextAfterEntry.minValueUsd) || 0;
  if (assignedMin < nextMin) return;
  await User.updateOne({ _id: uid }, { $set: { isVip: true } });
}

/**
 * @param {{ userId: string; tierId: string | null | undefined; assignedByUserId: string }} params
 * @returns {Promise<{ ok: true } | { ok: false; error: string }>}
 */
export async function setManualUserMembership({ userId, tierId, assignedByUserId }) {
  await connectDB();
  if (!mongoose.isValidObjectId(String(userId))) {
    return { ok: false, error: 'Invalid user id.' };
  }
  const uid = new mongoose.Types.ObjectId(String(userId));
  const aid = mongoose.isValidObjectId(String(assignedByUserId))
    ? new mongoose.Types.ObjectId(String(assignedByUserId))
    : null;

  const raw = tierId === null || tierId === undefined ? '' : String(tierId).trim();
  if (!raw) {
    await UserMembershipAssignment.deleteMany({ user: uid });
    return { ok: true };
  }
  if (!mongoose.isValidObjectId(raw)) {
    return { ok: false, error: 'Invalid membership tier id.' };
  }
  const tid = new mongoose.Types.ObjectId(raw);
  const tier = await MembershipTier.findById(tid).lean();
  if (!tier) {
    return { ok: false, error: 'Membership tier not found.' };
  }

  await UserMembershipAssignment.findOneAndUpdate(
    { user: uid },
    {
      user: uid,
      membershipTier: tid,
      assignmentType: 'manual',
      assignedBy: aid,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const tiersForVip = await MembershipTier.find({}).sort({ minValueUsd: 1, name: 1 }).limit(50).lean();
  await applyIsVipWhenPastEntryTier(userId, tier, tiersForVip);

  return { ok: true };
}

/**
 * @param {string} userId
 * @returns {Promise<{ tierId: string | null; tierName: string; slug: string; assignmentType: string } | null>}
 */
export async function getUserMembershipAssignmentLean(userId) {
  await connectDB();
  if (!mongoose.isValidObjectId(String(userId))) return null;
  const row = await UserMembershipAssignment.findOne({ user: userId })
    .populate('membershipTier', 'name slug minValueUsd')
    .lean();
  if (!row || !row.membershipTier) return null;
  const t = row.membershipTier;
  return {
    tierId: String(t._id),
    tierName: t.name || '',
    slug: t.slug || '',
    assignmentType: row.assignmentType || 'manual',
    minValueUsd: Number.isFinite(Number(t.minValueUsd)) ? Number(t.minValueUsd) : 0,
  };
}

/**
 * Assigns automatic membership from portfolio USD: **sticky** — never downgrade; upgrades when balance qualifies.
 * Manual assignments are kept unless portfolio qualifies for a **higher** tier (then upgrades to automatic).
 * Sets `isVip` when tier reaches the first step above entry (min 0).
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {{ portfolioUsd?: number }} [opts] Pass `portfolioUsd` when already computed (e.g. wallet summary) to avoid an extra read.
 * @returns {Promise<{ ok: true; tierId?: string; cleared?: boolean; unchanged?: boolean; skipped?: boolean; reason?: string } | { ok: false; error: string }>}
 */
export async function syncAutomaticMembershipForUser(userId, opts = {}) {
  await connectDB();
  if (!mongoose.isValidObjectId(String(userId))) {
    return { ok: false, error: 'INVALID_USER' };
  }

  let portfolioUsd = opts.portfolioUsd;
  if (!Number.isFinite(Number(portfolioUsd))) {
    const summary = await getWalletSummaryForUserId(userId);
    if (!summary.ok) {
      return { ok: true, skipped: true, reason: summary.error };
    }
    portfolioUsd = Number(summary.portfolioUsd) || 0;
  } else {
    portfolioUsd = Number(portfolioUsd) || 0;
  }

  const uid = new mongoose.Types.ObjectId(String(userId));
  const existing = await UserMembershipAssignment.findOne({ user: uid }).lean();
  const isManual = Boolean(
    existing && String(existing.assignmentType || '').toLowerCase() === 'manual'
  );

  const tiers = await MembershipTier.find({}).sort({ minValueUsd: 1, name: 1 }).limit(50).lean();
  if (!tiers.length) {
    if (existing && String(existing.assignmentType || '').toLowerCase() === 'automatic') {
      await UserMembershipAssignment.deleteMany({ user: uid });
    }
    return { ok: true, cleared: true };
  }

  const qualifiedBest = pickQualifiedTierForPortfolio(portfolioUsd, tiers);

  let heldTier = null;
  if (existing?.membershipTier) {
    heldTier = await MembershipTier.findById(existing.membershipTier).lean();
  }

  let best = qualifiedBest;
  if (heldTier) {
    const heldMin = Number(heldTier.minValueUsd) || 0;
    const qualMin = qualifiedBest ? Number(qualifiedBest.minValueUsd) || 0 : -Infinity;
    if (qualMin > heldMin) {
      best = qualifiedBest;
    } else {
      best = heldTier;
    }
  }

  if (!best) {
    return { ok: true, skipped: true, reason: 'NO_TIER' };
  }

  await applyIsVipWhenPastEntryTier(userId, best, tiers);

  const sameTier = existing && String(existing.membershipTier) === String(best._id);
  if (sameTier) {
    return { ok: true, unchanged: true };
  }

  const upgradedPastManual =
    isManual &&
    heldTier &&
    qualifiedBest &&
    Number(qualifiedBest.minValueUsd) > Number(heldTier.minValueUsd);

  await UserMembershipAssignment.findOneAndUpdate(
    { user: uid },
    {
      user: uid,
      membershipTier: best._id,
      assignmentType: upgradedPastManual ? 'automatic' : isManual ? 'manual' : 'automatic',
      assignedBy: upgradedPastManual ? null : isManual ? existing.assignedBy : null,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return { ok: true, tierId: String(best._id) };
}

/**
 * Recompute tier after wallet balance changes (admin credit, transfer, etc.).
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {{ portfolioUsd?: number }} [opts]
 */
export async function syncMembershipAfterWalletChange(userId, opts = {}) {
  return syncAutomaticMembershipForUser(userId, opts);
}

/**
 * Batch job: run {@link syncAutomaticMembershipForUser} for every active member (`role: user`, not soft-deleted).
 * Use from a secured cron HTTP route (e.g. Vercel Cron) so balances/deposits update tiers without a user opening the app.
 * @returns {Promise<{ ok: true; usersProcessed: number; tierUpdated: number; unchanged: number; skippedManual: number; skippedOther: number; cleared: number; errors: number }>}
 */
export async function syncAutomaticMembershipForAllUsers() {
  await connectDB();
  const users = await User.find({ role: 'user', deletedAt: null }).select('_id').lean();

  let usersProcessed = 0;
  let tierUpdated = 0;
  let unchanged = 0;
  let skippedManual = 0;
  let skippedOther = 0;
  let cleared = 0;
  let errors = 0;

  for (const row of users) {
    usersProcessed += 1;
    try {
      const r = await syncAutomaticMembershipForUser(row._id);
      if (!r.ok) {
        errors += 1;
        continue;
      }
      if (r.skipped && r.reason === 'manual') skippedManual += 1;
      else if (r.unchanged) unchanged += 1;
      else if (r.cleared) cleared += 1;
      else if (r.tierId) tierUpdated += 1;
      else if (r.skipped) skippedOther += 1;
    } catch {
      errors += 1;
    }
  }

  return {
    ok: true,
    usersProcessed,
    tierUpdated,
    unchanged,
    skippedManual,
    skippedOther,
    cleared,
    errors,
  };
}
