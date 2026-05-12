import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
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

const TYPES = [
  'drawing_launch',
  'drawing_result',
  'maintenance',
  'wallet_token',
  'membership',
  'security',
  'policy',
  'promotion',
  'general',
];
const AUDIENCES = ['all_users', 'vip_only', 'non_vip_only'];
const PRIORITIES = ['normal', 'high', 'critical'];

function parseAnnouncementBody(body) {
  const title = String(body.title || '').trim();
  const type = String(body.type || 'general').trim();
  const audience = String(body.audience || 'all_users').trim();
  const priority = String(body.priority || 'normal').trim();
  const summary = String(body.summary || '').trim();
  const details = String(body.details || '').trim();
  const startsAtRaw = String(body.startsAt || '').trim();
  const endsAtRaw = body.endsAt === null || body.endsAt === undefined ? '' : String(body.endsAt).trim();
  const ctaLabel = String(body?.cta?.label || '').trim();
  const ctaUrl = String(body?.cta?.url || '').trim();
  const channels = {
    dashboardBanner: Boolean(body?.channels?.dashboardBanner),
    inAppNotice: Boolean(body?.channels?.inAppNotice),
    emailNotice: Boolean(body?.channels?.emailNotice),
  };

  if (!title || !summary || !details || !startsAtRaw) {
    return { error: 'Title, summary, details and publish start are required.' };
  }
  if (!TYPES.includes(type)) {
    return { error: 'Invalid announcement type.' };
  }
  if (!AUDIENCES.includes(audience)) {
    return { error: 'Invalid audience type.' };
  }
  if (!PRIORITIES.includes(priority)) {
    return { error: 'Invalid priority type.' };
  }
  if (!channels.dashboardBanner && !channels.inAppNotice && !channels.emailNotice) {
    return { error: 'Select at least one delivery channel.' };
  }
  if ((ctaLabel && !ctaUrl) || (!ctaLabel && ctaUrl)) {
    return { error: 'Action label and action URL should be filled together.' };
  }

  const startsAt = new Date(startsAtRaw);
  if (Number.isNaN(startsAt.getTime())) {
    return { error: 'Invalid publish start date/time.' };
  }
  let endsAt = null;
  if (endsAtRaw) {
    endsAt = new Date(endsAtRaw);
    if (Number.isNaN(endsAt.getTime()) || endsAt.getTime() <= startsAt.getTime()) {
      return { error: 'End date/time must be after publish start.' };
    }
  }

  return {
    data: {
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
    },
  };
}

export async function PATCH(request, { params }) {
  try {
    const auth = await requireSuperadmin(request);
    if ('error' in auth) return auth.error;

    const id = String(params?.id || '').trim();
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ ok: false, error: 'Invalid announcement id.' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const parsed = parseAnnouncementBody(body);
    if (parsed.error) {
      return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
    }

    await connectDB();
    const updated = await CommunityAnnouncement.findByIdAndUpdate(
      id,
      { $set: parsed.data },
      { new: true, runValidators: true }
    ).lean();

    if (!updated) {
      return NextResponse.json({ ok: false, error: 'Announcement not found.' }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      announcement: serializeAnnouncement(updated),
      message: 'Announcement updated successfully.',
    });
  } catch (e) {
    console.error('superadmin/community-announcements/[id] PATCH', e);
    return NextResponse.json({ ok: false, error: 'Failed to update announcement.' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = await requireSuperadmin(request);
    if ('error' in auth) return auth.error;

    const id = String(params?.id || '').trim();
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ ok: false, error: 'Invalid announcement id.' }, { status: 400 });
    }

    await connectDB();
    const deleted = await CommunityAnnouncement.findByIdAndDelete(id).lean();
    if (!deleted) {
      return NextResponse.json({ ok: false, error: 'Announcement not found.' }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      message: 'Announcement deleted successfully.',
      id: String(deleted._id),
    });
  } catch (e) {
    console.error('superadmin/community-announcements/[id] DELETE', e);
    return NextResponse.json({ ok: false, error: 'Failed to delete announcement.' }, { status: 500 });
  }
}
