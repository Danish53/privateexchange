import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import { compareOtp } from '@/lib/otp';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const body = await request.json();
    const email = String(body.email || '')
      .trim()
      .toLowerCase();
    const otp = String(body.otp || '').replace(/\D/g, '');
    const password = String(body.password || '');

    if (!email || otp.length !== 6) {
      return NextResponse.json({ ok: false, error: 'Email and 6-digit code are required.' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json(
        { ok: false, error: 'Password must be at least 8 characters.' },
        { status: 400 }
      );
    }

    await connectDB();
    const user = await User.findOne({ email });
    if (!user || !user.emailVerified) {
      return NextResponse.json({ ok: false, error: 'Invalid or expired reset code.' }, { status: 400 });
    }
    if (!user.resetPasswordOtpHash || !user.resetPasswordOtpExpires) {
      return NextResponse.json({ ok: false, error: 'No reset in progress. Request a new code.' }, { status: 400 });
    }
    if (user.resetPasswordOtpExpires < new Date()) {
      return NextResponse.json({ ok: false, error: 'Reset code expired. Request a new one.' }, { status: 400 });
    }

    const match = await compareOtp(otp, user.resetPasswordOtpHash);
    if (!match) {
      return NextResponse.json({ ok: false, error: 'Invalid reset code.' }, { status: 400 });
    }

    user.passwordHash = await bcrypt.hash(password, 12);
    user.resetPasswordOtpHash = null;
    user.resetPasswordOtpExpires = null;
    await user.save();

    return NextResponse.json({ ok: true, message: 'Password updated. You can sign in.' });
  } catch (e) {
    console.error('reset-password', e);
    return NextResponse.json({ ok: false, error: 'Reset failed.' }, { status: 500 });
  }
}
