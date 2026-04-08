import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import { requireAuthUser, serializeUser } from '@/lib/authHelpers';

export const runtime = 'nodejs';

export async function GET(request) {
  try {
    const auth = requireAuthUser(request);
    if ('error' in auth) return auth.error;

    await connectDB();
    const user = await User.findById(auth.userId).lean();
    if (!user) {
      return NextResponse.json({ ok: false, error: 'User not found' }, { status: 401 });
    }

    return NextResponse.json({
      ok: true,
      user: serializeUser(user),
    });
  } catch (e) {
    console.error('me', e);
    return NextResponse.json({ ok: false, error: 'Failed' }, { status: 500 });
  }
}
