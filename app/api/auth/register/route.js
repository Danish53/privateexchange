import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import { ensureWalletForMemberUser } from '@/lib/walletService';
import { generateSixDigitOtp, hashOtp } from '@/lib/otp';
import { sendVerificationOtp } from '@/lib/mail';

export const runtime = 'nodejs';

const OTP_MS = 10 * 60 * 1000;

export async function POST(request) {
  try {
    const body = await request.json();
    const email = String(body.email || '')
      .trim()
      .toLowerCase();
    const password = String(body.password || '');
    const name = String(body.name || '').trim();
    /** Public self-serve registration is members only; admins are provisioned by superadmin. */
    const role = 'user';

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ ok: false, error: 'Valid email is required.' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json(
        { ok: false, error: 'Password must be at least 8 characters.' },
        { status: 400 }
      );
    }

    await connectDB();

    const passwordHash = await bcrypt.hash(password, 12);
    const otp = generateSixDigitOtp();
    const otpHash = await hashOtp(otp);
    const verificationOtpExpires = new Date(Date.now() + OTP_MS);

    let user = await User.findOne({ email });

    if (user?.emailVerified) {
      return NextResponse.json({ ok: false, error: 'An account with this email already exists.' }, { status: 409 });
    }

    if (user) {
      user.passwordHash = passwordHash;
      user.name = name || user.name;
      user.role = role;
      user.isVip = false;
      user.verificationOtpHash = otpHash;
      user.verificationOtpExpires = verificationOtpExpires;
      await user.save();
    } else {
      user = await User.create({
        email,
        passwordHash,
        name,
        role,
        isVip: false,
        emailVerified: false,
        verificationOtpHash: otpHash,
        verificationOtpExpires,
      });
    }

    if (user?.role === 'user') {
      await ensureWalletForMemberUser(user._id);
    }

    await sendVerificationOtp(email, otp, name);

    const devOtp =
      process.env.NODE_ENV === 'development' && process.env.DEV_RETURN_OTP === 'true' ? otp : undefined;

    return NextResponse.json({
      ok: true,
      message: 'Check your email for a verification code.',
      email,
      ...(devOtp ? { devOtp } : {}),
    });
  } catch (e) {
    console.error('register', e);
    return NextResponse.json({ ok: false, error: 'Registration failed.' }, { status: 500 });
  }
}
