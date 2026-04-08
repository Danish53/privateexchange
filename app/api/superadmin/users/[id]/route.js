import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import { requireSuperAdmin } from '@/lib/authHelpers';

export const runtime = 'nodejs';

/** Soft-delete a user (not superadmin; not self). */
export async function DELETE(request, context) {
  try {
    const auth = await requireSuperAdmin(request);
    if ('error' in auth) return auth.error;

    const params = await Promise.resolve(context.params);
    const id = params?.id;
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ ok: false, error: 'Invalid id.' }, { status: 400 });
    }

    await connectDB();
    const target = await User.findById(id);
    if (!target) {
      return NextResponse.json({ ok: false, error: 'User not found.' }, { status: 404 });
    }
    if (target.role === 'superadmin') {
      return NextResponse.json({ ok: false, error: 'Cannot archive a super admin account.' }, { status: 403 });
    }
    if (String(target._id) === auth.userId) {
      return NextResponse.json({ ok: false, error: 'You cannot archive your own session.' }, { status: 403 });
    }
    if (target.deletedAt) {
      return NextResponse.json({ ok: false, error: 'Account is already archived.' }, { status: 400 });
    }

    target.deletedAt = new Date();
    await target.save();

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('superadmin/users/[id] DELETE', e);
    return NextResponse.json({ ok: false, error: 'Failed to archive user.' }, { status: 500 });
  }
}
