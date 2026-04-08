import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/token';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';

/** @returns {{ userId: string } | { error: Response }} */
export function requireAuthUser(request) {
  const auth = request.headers.get('authorization');
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) {
    return { error: NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 }) };
  }
  const payload = verifyAuthToken(token);
  const sub = payload?.sub;
  if (!sub || typeof sub !== 'string') {
    return { error: NextResponse.json({ ok: false, error: 'Invalid token' }, { status: 401 }) };
  }
  if (!mongoose.isValidObjectId(sub)) {
    return { error: NextResponse.json({ ok: false, error: 'Invalid token' }, { status: 401 }) };
  }
  return { userId: sub };
}

/** @returns {Promise<{ userId: string } | { error: Response }>} */
export async function requireSuperAdmin(request) {
  const auth = requireAuthUser(request);
  if ('error' in auth) return auth;
  await connectDB();
  const user = await User.findById(auth.userId).lean();
  if (!user || user.role !== 'superadmin') {
    return { error: NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 }) };
  }
  return { userId: auth.userId };
}

/** @param {import('mongoose').Document | Record<string, unknown>} doc */
export function serializeUser(doc) {
  const u =
    doc && typeof doc.toObject === 'function' ? doc.toObject() : /** @type {Record<string, unknown>} */ (doc);
  return {
    id: String(u._id),
    email: u.email,
    name: u.name || '',
    role: u.role,
    phone: u.phone || '',
    country: u.country || '',
    timezone: u.timezone || '',
    avatarUrl: u.avatarUrl || '',
    createdAt: u.createdAt ? new Date(/** @type {string|Date} */ (u.createdAt)).toISOString() : undefined,
  };
}
