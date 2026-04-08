import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import { serializeUser } from '@/lib/authHelpers';
import { signAuthToken } from '@/lib/token';
import { toPublicUser } from '@/lib/auth-api';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const body = await request.json();
    const email = String(body.email || '')
      .trim()
      .toLowerCase();
    const password = String(body.password || '');

    if (!email || !password) {
      return NextResponse.json({ ok: false, error: 'Email and password are required.' }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ ok: false, error: 'Invalid email or password.' }, { status: 401 });
    }
    if (user.deletedAt) {
      return NextResponse.json(
        { ok: false, error: 'This account is disabled. Contact support if you believe this is a mistake.' },
        { status: 403 }
      );
    }
    if (!user.emailVerified) {
      return NextResponse.json(
        { ok: false, error: 'Please verify your email first.', code: 'UNVERIFIED' },
        { status: 403 }
      );
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ ok: false, error: 'Invalid email or password.' }, { status: 401 });
    }

    const token = signAuthToken({ userId: user._id.toString(), email: user.email, role: user.role });

    return NextResponse.json({
      ok: true,
      token,
      user: serializeUser(user),
    });
  } catch (e) {
    console.error('login', e);
    return NextResponse.json({ ok: false, error: 'Sign in failed.' }, { status: 500 });
  }
}
