import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { loadRequestActor } from '@/lib/authHelpers';
import { normalizeSuperadminAnnouncementBody } from '@/lib/communityAnnouncementNormalize';
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

export async function PATCH(request, { params }) {
  try {
    const auth = await requireSuperadmin(request);
    if ('error' in auth) return auth.error;

    const id = String(params?.id || '').trim();
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ ok: false, error: 'Invalid announcement id.' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const parsed = normalizeSuperadminAnnouncementBody(body);
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
