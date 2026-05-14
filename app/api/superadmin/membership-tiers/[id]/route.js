import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { loadRequestActor } from '@/lib/authHelpers';
import { allocateMembershipTierSlug } from '@/lib/membershipTierSlug';
import { normalizeTierBody } from '@/lib/membershipTierNormalize';
import { serializeMembershipTier } from '@/lib/membershipTierSerialize';
import MembershipTier from '@/lib/models/MembershipTier';

export const runtime = 'nodejs';

async function requireSuperadmin(request) {
  const auth = await loadRequestActor(request);
  if ('error' in auth) return auth;
  if (auth.user?.role !== 'superadmin') {
    return { error: NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 }) };
  }
  return auth;
}

export async function GET(request, { params }) {
  try {
    const auth = await requireSuperadmin(request);
    if ('error' in auth) return auth.error;

    const p = await params;
    const id = String(p?.id || '');
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ ok: false, error: 'Invalid tier id.' }, { status: 400 });
    }

    await connectDB();
    const doc = await MembershipTier.findById(id).lean();
    if (!doc) {
      return NextResponse.json({ ok: false, error: 'Membership tier not found.' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, tier: serializeMembershipTier(doc) });
  } catch (e) {
    console.error('superadmin/membership-tiers/[id] GET', e);
    return NextResponse.json({ ok: false, error: 'Failed to load membership tier.' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const auth = await requireSuperadmin(request);
    if ('error' in auth) return auth.error;

    const p = await params;
    const id = String(p?.id || '');
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ ok: false, error: 'Invalid tier id.' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const parsed = normalizeTierBody(body);
    if (parsed.error) {
      return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
    }

    await connectDB();
    const tier = await MembershipTier.findById(id);
    if (!tier) {
      return NextResponse.json({ ok: false, error: 'Membership tier not found.' }, { status: 404 });
    }

    const prevName = String(tier.name || '').trim();
    const nextName = parsed.data.name;

    let nextSlug = tier.slug;
    if (prevName !== nextName) {
      nextSlug = await allocateMembershipTierSlug(MembershipTier, nextName, tier._id);
    }

    tier.name = nextName;
    tier.slug = nextSlug;
    tier.minValueUsd = parsed.data.minValueUsd;
    tier.benefits = parsed.data.benefits;
    await tier.save();

    return NextResponse.json({
      ok: true,
      tier: serializeMembershipTier(tier),
      message: 'Membership tier updated.',
    });
  } catch (e) {
    console.error('superadmin/membership-tiers/[id] PATCH', e);
    const msg = e?.errors ? Object.values(e.errors).map((x) => x?.message).filter(Boolean).join(' ') : '';
    return NextResponse.json(
      { ok: false, error: msg || 'Failed to update membership tier.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = await requireSuperadmin(request);
    if ('error' in auth) return auth.error;

    const p = await params;
    const id = String(p?.id || '');
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ ok: false, error: 'Invalid tier id.' }, { status: 400 });
    }

    await connectDB();
    const deleted = await MembershipTier.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ ok: false, error: 'Membership tier not found.' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, message: 'Membership tier deleted.' });
  } catch (e) {
    console.error('superadmin/membership-tiers/[id] DELETE', e);
    return NextResponse.json({ ok: false, error: 'Failed to delete membership tier.' }, { status: 500 });
  }
}
