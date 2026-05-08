import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { loadRequestActor } from '@/lib/authHelpers';
import CommunityAnnouncement from '@/lib/models/CommunityAnnouncement';

export const runtime = 'nodejs';

function serializeAnnouncement(doc) {
  const d = doc && typeof doc.toObject === 'function' ? doc.toObject() : doc;
  return {
    id: String(d._id),
    title: d.title || '',
    type: d.type || 'general',
    audience: d.audience || 'all_users',
    priority: d.priority || 'normal',
    summary: d.summary || '',
    details: d.details || '',
    startsAt: d.startsAt ? new Date(d.startsAt).toISOString() : '',
    endsAt: d.endsAt ? new Date(d.endsAt).toISOString() : '',
    cta: {
      label: d?.cta?.label || '',
      url: d?.cta?.url || '',
    },
    channels: {
      dashboardBanner: Boolean(d?.channels?.dashboardBanner),
      inAppNotice: Boolean(d?.channels?.inAppNotice),
      emailNotice: Boolean(d?.channels?.emailNotice),
    },
    createdBy: d.createdBy ? String(d.createdBy) : '',
    createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : '',
    updatedAt: d.updatedAt ? new Date(d.updatedAt).toISOString() : '',
  };
}

async function requireSuperadmin(request) {
  const auth = await loadRequestActor(request);
  if ('error' in auth) return auth;
  if (auth.user?.role !== 'superadmin') {
    return { error: NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 }) };
  }
  return auth;
}

export async function GET(request) {
  try {
    const auth = await requireSuperadmin(request);
    if ('error' in auth) return auth.error;

    await connectDB();
    const rows = await CommunityAnnouncement.find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({
      ok: true,
      announcements: rows.map((r) => serializeAnnouncement(r)),
    });
  } catch (e) {
    console.error('superadmin/community-announcements GET', e);
    return NextResponse.json({ ok: false, error: 'Failed to load announcements.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await requireSuperadmin(request);
    if ('error' in auth) return auth.error;

    const body = await request.json().catch(() => ({}));
    const title = String(body.title || '').trim();
    const type = String(body.type || 'general').trim();
    const audience = String(body.audience || 'all_users').trim();
    const priority = String(body.priority || 'normal').trim();
    const summary = String(body.summary || '').trim();
    const details = String(body.details || '').trim();
    const startsAtRaw = String(body.startsAt || '').trim();
    const endsAtRaw = String(body.endsAt || '').trim();
    const ctaLabel = String(body?.cta?.label || '').trim();
    const ctaUrl = String(body?.cta?.url || '').trim();
    const channels = {
      dashboardBanner: Boolean(body?.channels?.dashboardBanner),
      inAppNotice: Boolean(body?.channels?.inAppNotice),
      emailNotice: Boolean(body?.channels?.emailNotice),
    };

    if (!title || !summary || !details || !startsAtRaw) {
      return NextResponse.json(
        { ok: false, error: 'Title, summary, details and publish start are required.' },
        { status: 400 }
      );
    }
    if (!['drawing_launch', 'drawing_result', 'maintenance', 'wallet_token', 'membership', 'security', 'policy', 'promotion', 'general'].includes(type)) {
      return NextResponse.json({ ok: false, error: 'Invalid announcement type.' }, { status: 400 });
    }
    if (!['all_users', 'vip_only', 'non_vip_only'].includes(audience)) {
      return NextResponse.json({ ok: false, error: 'Invalid audience type.' }, { status: 400 });
    }
    if (!['normal', 'high', 'critical'].includes(priority)) {
      return NextResponse.json({ ok: false, error: 'Invalid priority type.' }, { status: 400 });
    }
    if (!channels.dashboardBanner && !channels.inAppNotice && !channels.emailNotice) {
      return NextResponse.json({ ok: false, error: 'Select at least one delivery channel.' }, { status: 400 });
    }
    if ((ctaLabel && !ctaUrl) || (!ctaLabel && ctaUrl)) {
      return NextResponse.json(
        { ok: false, error: 'Action label and action URL should be filled together.' },
        { status: 400 }
      );
    }

    const startsAt = new Date(startsAtRaw);
    if (Number.isNaN(startsAt.getTime())) {
      return NextResponse.json({ ok: false, error: 'Invalid publish start date/time.' }, { status: 400 });
    }
    let endsAt = null;
    if (endsAtRaw) {
      endsAt = new Date(endsAtRaw);
      if (Number.isNaN(endsAt.getTime()) || endsAt.getTime() <= startsAt.getTime()) {
        return NextResponse.json({ ok: false, error: 'End date/time must be after publish start.' }, { status: 400 });
      }
    }

    await connectDB();
    const created = await CommunityAnnouncement.create({
      title,
      type,
      audience,
      priority,
      summary,
      details,
      startsAt,
      endsAt,
      cta: { label: ctaLabel, url: ctaUrl },
      channels,
      createdBy: auth.userId,
    });

    return NextResponse.json({
      ok: true,
      announcement: serializeAnnouncement(created),
      message: 'Announcement created successfully.',
    });
  } catch (e) {
    console.error('superadmin/community-announcements POST', e);
    return NextResponse.json({ ok: false, error: 'Failed to create announcement.' }, { status: 500 });
  }
}
