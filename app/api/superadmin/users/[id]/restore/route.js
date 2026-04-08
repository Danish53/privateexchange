import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import { requireSuperAdmin } from '@/lib/authHelpers';

export const runtime = 'nodejs';

/** Restore a soft-deleted user. */
export async function POST(request, context) {
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
      return NextResponse.json({ ok: false, error: 'Invalid target.' }, { status: 403 });
    }
    if (!target.deletedAt) {
      return NextResponse.json({ ok: false, error: 'Account is not archived.' }, { status: 400 });
    }

    target.deletedAt = null;
    await target.save();

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('superadmin/users/[id]/restore', e);
    return NextResponse.json({ ok: false, error: 'Failed to restore user.' }, { status: 500 });
  }
}
