import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import { requireAuthUser, serializeUser } from '@/lib/authHelpers';

export const runtime = 'nodejs';

export async function PATCH(request) {
  try {
    const auth = requireAuthUser(request);
    if ('error' in auth) return auth.error;

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ ok: false, error: 'Invalid request body.' }, { status: 400 });
    }

    const name = body.name !== undefined ? String(body.name).trim() : undefined;
    const phone = body.phone !== undefined ? String(body.phone).trim() : undefined;
    const country = body.country !== undefined ? String(body.country).trim() : undefined;
    const timezone = body.timezone !== undefined ? String(body.timezone).trim() : undefined;

    await connectDB();

    const user = await User.findById(auth.userId);
    if (!user) {
      return NextResponse.json({ ok: false, error: 'User not found.' }, { status: 404 });
    }

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (country !== undefined) user.country = country;
    if (timezone !== undefined) user.timezone = timezone;

    await user.save();

    return NextResponse.json({ ok: true, user: serializeUser(user) });
  } catch (e) {
    console.error('profile PATCH', e);
    const detail = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { ok: false, error: 'Could not update profile.', detail },
      { status: 500 }
    );
  }
}
