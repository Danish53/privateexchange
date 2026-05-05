import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import { requireAuthUser } from '@/lib/authHelpers';

export const runtime = 'nodejs';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET(request) {
  try {
    const auth = requireAuthUser(request);
    if ('error' in auth) return auth.error;

    const { searchParams } = new URL(request.url);
    const email = String(searchParams.get('email') || '').trim().toLowerCase();
    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ ok: false, error: 'Enter a valid email.' }, { status: 400 });
    }

    await connectDB();
    const recipient = await User.findOne({ email, role: 'user', deletedAt: null })
      .select('_id email name isVip')
      .lean();

    if (!recipient) {
      return NextResponse.json({ ok: false, error: 'User not found with this email.' }, { status: 404 });
    }
    if (String(recipient._id) === auth.userId) {
      return NextResponse.json({ ok: false, error: 'You cannot transfer to your own account.' }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      recipient: {
        id: String(recipient._id),
        email: recipient.email,
        name: String(recipient.name || '').trim() || recipient.email.split('@')[0],
        isVip: !!recipient.isVip,
      },
    });
  } catch (e) {
    console.error('user/transfer/recipient GET', e);
    return NextResponse.json({ ok: false, error: 'Failed to verify recipient.' }, { status: 500 });
  }
}
