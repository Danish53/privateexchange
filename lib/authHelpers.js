import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/token';

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
