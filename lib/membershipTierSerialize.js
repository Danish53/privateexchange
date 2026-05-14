import { slugifyTierName } from '@/lib/membershipTierSlug';

export function serializeMembershipTier(doc) {
  const d = doc && typeof doc.toObject === 'function' ? doc.toObject() : doc;
  const benefits = Array.isArray(d.benefits) ? d.benefits.filter((b) => typeof b === 'string' && b.trim()) : [];
  return {
    id: String(d._id),
    name: d.name || '',
    slug: d.slug || slugifyTierName(d.name) || '',
    minValueUsd: Number.isFinite(Number(d.minValueUsd)) ? Number(d.minValueUsd) : 0,
    benefits,
    createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : '',
    updatedAt: d.updatedAt ? new Date(d.updatedAt).toISOString() : '',
  };
}
