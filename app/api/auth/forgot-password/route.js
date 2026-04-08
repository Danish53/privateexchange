import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import { generateSixDigitOtp, hashOtp } from '@/lib/otp';
import { sendPasswordResetOtp } from '@/lib/mail';

export const runtime = 'nodejs';

const RESET_MS = 15 * 60 * 1000;

export async function POST(request) {
  try {
    const body = await request.json();
    const email = String(body.email || '')
      .trim()
      .toLowerCase();

    if (!email) {
      return NextResponse.json({ ok: false, error: 'Email is required.' }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email });

    const generic = {
      ok: true,
      message: 'If an account exists for that email, we sent a reset code.',
    };

    if (!user || !user.emailVerified) {
      return NextResponse.json(generic);
    }

    const otp = generateSixDigitOtp();
    const otpHash = await hashOtp(otp);
    user.resetPasswordOtpHash = otpHash;
    user.resetPasswordOtpExpires = new Date(Date.now() + RESET_MS);
    await user.save();

    await sendPasswordResetOtp(email, otp, user.name);

    const devOtp =
      process.env.NODE_ENV === 'development' && process.env.DEV_RETURN_OTP === 'true' ? otp : undefined;

    return NextResponse.json({
      ...generic,
      ...(devOtp ? { devOtp } : {}),
    });
  } catch (e) {
    console.error('forgot-password', e);
    return NextResponse.json({ ok: false, error: 'Request failed.' }, { status: 500 });
  }
}
