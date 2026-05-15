import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireMembershipManage } from '@/lib/authHelpers';
import { allocateMembershipTierSlug } from '@/lib/membershipTierSlug';
import { normalizeTierBody } from '@/lib/membershipTierNormalize';
import { serializeMembershipTier } from '@/lib/membershipTierSerialize';
import MembershipTier from '@/lib/models/MembershipTier';

export const runtime = 'nodejs';

export async function GET(request) {
  try {
    const auth = await requireMembershipManage(request);
    if ('error' in auth) return auth.error;

    await connectDB();
    const rows = await MembershipTier.find({}).sort({ minValueUsd: 1, name: 1 }).limit(100).lean();

    return NextResponse.json({
      ok: true,
      tiers: rows.map((r) => serializeMembershipTier(r)),
    });
  } catch (e) {
    console.error('superadmin/membership-tiers GET', e);
    return NextResponse.json({ ok: false, error: 'Failed to load membership tiers.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await requireMembershipManage(request);
    if ('error' in auth) return auth.error;

    const body = await request.json().catch(() => ({}));
    const parsed = normalizeTierBody(body);
    if (parsed.error) {
      return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
    }

    await connectDB();
    const slug = await allocateMembershipTierSlug(MembershipTier, parsed.data.name);
    const created = await MembershipTier.create({
      ...parsed.data,
      slug,
      createdBy: auth.userId,
    });

    return NextResponse.json({
      ok: true,
      tier: serializeMembershipTier(created),
      message: 'Membership tier created.',
    });
  } catch (e) {
    console.error('superadmin/membership-tiers POST', e);
    const msg = e?.errors ? Object.values(e.errors).map((x) => x?.message).filter(Boolean).join(' ') : '';
    return NextResponse.json(
      { ok: false, error: msg || 'Failed to create membership tier.' },
      { status: 500 }
    );
  }
}
