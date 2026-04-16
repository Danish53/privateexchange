import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/token';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import {
  mergeAdminPermissions,
  userHasUsersPermission,
  hasAnyUsersModulePermission,
  userHasWalletsView,
  userHasWalletsAdjust,
} from '@/lib/adminPermissions';

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

/**
 * Superadmin or platform admin (same operations shell, overview metrics shared).
 * @returns {Promise<{ userId: string; user: Record<string, unknown>; isSuperAdmin: boolean } | { error: Response }>}
 */
export async function requireSuperAdminOrAdmin(request) {
  const auth = requireAuthUser(request);
  if ('error' in auth) return auth;
  await connectDB();
  const user = await User.findById(auth.userId).lean();
  if (!user || user.deletedAt) {
    return { error: NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 }) };
  }
  if (user.role !== 'superadmin' && user.role !== 'admin') {
    return { error: NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 }) };
  }
  return {
    userId: auth.userId,
    user,
    isSuperAdmin: user.role === 'superadmin',
  };
}

/**
 * Authenticated user (any role). Use for permission checks in route handlers.
 * @returns {Promise<{ userId: string; user: Record<string, unknown> } | { error: Response }>}
 */
export async function loadRequestActor(request) {
  const auth = requireAuthUser(request);
  if ('error' in auth) return auth;
  await connectDB();
  const user = await User.findById(auth.userId).lean();
  if (!user || user.deletedAt) {
    return { error: NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 }) };
  }
  return { userId: auth.userId, user };
}

/**
 * Superadmin or admin with Users module permission.
 * @param {'view'|'create'|'edit'|'delete'} action
 * @returns {Promise<{ userId: string; user: Record<string, unknown>; isSuperAdmin: boolean } | { error: Response }>}
 */
export async function requireUsersModule(request, action) {
  const act = await loadRequestActor(request);
  if ('error' in act) return act;
  if (!userHasUsersPermission(act.user, action)) {
    return { error: NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 }) };
  }
  return {
    userId: act.userId,
    user: act.user,
    isSuperAdmin: act.user.role === 'superadmin',
  };
}

/**
 * Superadmin or admin with any Users-module permission (opens list route; row actions still per-action).
 * @returns {Promise<{ userId: string; user: Record<string, unknown>; isSuperAdmin: boolean } | { error: Response }>}
 */
export async function requireAnyUsersModuleAccess(request) {
  const act = await loadRequestActor(request);
  if ('error' in act) return act;
  if (!hasAnyUsersModulePermission(act.user)) {
    return { error: NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 }) };
  }
  return {
    userId: act.userId,
    user: act.user,
    isSuperAdmin: act.user.role === 'superadmin',
  };
}

/**
 * Superadmin or admin with Wallets view (or adjust — adjust implies list access).
 * @returns {Promise<{ userId: string; user: Record<string, unknown>; isSuperAdmin: boolean } | { error: Response }>}
 */
export async function requireWalletsView(request) {
  const act = await loadRequestActor(request);
  if ('error' in act) return act;
  if (!userHasWalletsView(act.user)) {
    return { error: NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 }) };
  }
  return {
    userId: act.userId,
    user: act.user,
    isSuperAdmin: act.user.role === 'superadmin',
  };
}

/**
 * Superadmin or admin with permission to change member token balances.
 * @returns {Promise<{ userId: string; user: Record<string, unknown>; isSuperAdmin: boolean } | { error: Response }>}
 */
export async function requireWalletsAdjust(request) {
  const act = await loadRequestActor(request);
  if ('error' in act) return act;
  if (!userHasWalletsAdjust(act.user)) {
    return { error: NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 }) };
  }
  return {
    userId: act.userId,
    user: act.user,
    isSuperAdmin: act.user.role === 'superadmin',
  };
}

/** @param {import('mongoose').Document | Record<string, unknown>} doc */
export function serializeUser(doc) {
  const u =
    doc && typeof doc.toObject === 'function' ? doc.toObject() : /** @type {Record<string, unknown>} */ (doc);
  const base = {
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
  if (u.role === 'admin') {
    return { ...base, adminPermissions: mergeAdminPermissions(u.adminPermissions) };
  }
  return base;
}
