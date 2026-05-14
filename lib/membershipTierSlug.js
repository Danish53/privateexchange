import mongoose from 'mongoose';

/**
 * URL-safe slug from display name (same rules as superadmin drawings).
 * @param {string} value
 */
export function slugifyTierName(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const MAX_SLUG_LEN = 128;

/**
 * @param {import('mongoose').Model} MembershipTier
 * @param {string} name
 * @param {string | import('mongoose').Types.ObjectId | undefined} [excludeId] — document to ignore (e.g. on PATCH)
 * @returns {Promise<string>}
 */
export async function allocateMembershipTierSlug(MembershipTier, name, excludeId) {
  let base = slugifyTierName(name);
  if (!base) base = 'membership-tier';
  if (base.length > 96) base = base.slice(0, 96).replace(/-+$/, '');

  const excludeOid =
    excludeId && mongoose.isValidObjectId(String(excludeId))
      ? new mongoose.Types.ObjectId(String(excludeId))
      : null;

  let candidate = base;
  let n = 2;
  for (let attempt = 0; attempt < 500; attempt += 1) {
    const filter =
      excludeOid != null ? { slug: candidate, _id: { $ne: excludeOid } } : { slug: candidate };
    const exists = await MembershipTier.exists(filter);
    if (!exists) return candidate;
    const suffix = `-${n}`;
    n += 1;
    const room = MAX_SLUG_LEN - suffix.length;
    candidate = (base.length <= room ? base : base.slice(0, room).replace(/-+$/, '')) + suffix;
  }
  return `${base.slice(0, 40)}-${Date.now().toString(36)}`;
}
