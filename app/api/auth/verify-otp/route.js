import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import { serializeUser } from '@/lib/authHelpers';
import { compareOtp } from '@/lib/otp';
import { signAuthToken } from '@/lib/token';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const body = await request.json();
    const email = String(body.email || '')
      .trim()
      .toLowerCase();
    const otp = String(body.otp || '').replace(/\D/g, '');

    if (!email || otp.length !== 6) {
      return NextResponse.json({ ok: false, error: 'Email and 6-digit code are required.' }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ ok: false, error: 'Invalid code or email.' }, { status: 400 });
    }
    if (user.emailVerified) {
      return NextResponse.json({ ok: false, error: 'This email is already verified. Sign in.' }, { status: 400 });
    }
    if (!user.verificationOtpHash || !user.verificationOtpExpires) {
      return NextResponse.json({ ok: false, error: 'No pending verification. Register again.' }, { status: 400 });
    }
    if (user.verificationOtpExpires < new Date()) {
      return NextResponse.json({ ok: false, error: 'Code expired. Request a new one.' }, { status: 400 });
    }

    const match = await compareOtp(otp, user.verificationOtpHash);
    if (!match) {
      return NextResponse.json({ ok: false, error: 'Invalid verification code.' }, { status: 400 });
    }

    user.emailVerified = true;
    user.verificationOtpHash = null;
    user.verificationOtpExpires = null;
    await user.save();

    const token = signAuthToken({ userId: user._id.toString(), email: user.email, role: user.role });

    return NextResponse.json({
      ok: true,
      token,
      user: serializeUser(user),
    });
  } catch (e) {
    console.error('verify-otp', e);
    return NextResponse.json({ ok: false, error: 'Verification failed.' }, { status: 500 });
  }
}
