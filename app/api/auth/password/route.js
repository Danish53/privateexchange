import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import { requireAuthUser } from '@/lib/authHelpers';

export const runtime = 'nodejs';

export async function PATCH(request) {
  try {
    const auth = requireAuthUser(request);
    if ('error' in auth) return auth.error;

    const body = await request.json();
    const currentPassword = String(body.currentPassword || '');
    const newPassword = String(body.newPassword || '');

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { ok: false, error: 'Current password and new password are required.' },
        { status: 400 }
      );
    }
    if (newPassword.length < 8) {
      return NextResponse.json(
        { ok: false, error: 'New password must be at least 8 characters.' },
        { status: 400 }
      );
    }

    await connectDB();
    const user = await User.findById(auth.userId);
    if (!user) {
      return NextResponse.json({ ok: false, error: 'User not found.' }, { status: 404 });
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ ok: false, error: 'Current password is incorrect.' }, { status: 401 });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();

    return NextResponse.json({ ok: true, message: 'Password updated.' });
  } catch (e) {
    console.error('password PATCH', e);
    return NextResponse.json({ ok: false, error: 'Could not update password.' }, { status: 500 });
  }
}
