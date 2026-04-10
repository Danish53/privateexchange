import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import { sendProvisionedCredentials } from '@/lib/mail';

export function loginUrlFromRequest(request) {
  const origin = request.headers.get('origin');
  if (origin) return `${origin.replace(/\/$/, '')}/login`;
  const host = request.headers.get('host');
  if (host) {
    const proto = host.startsWith('localhost') || host.startsWith('127.') ? 'http' : 'https';
    return `${proto}://${host}/login`;
  }
  return 'https://759exchange.local/login';
}

/**
 * Superadmin-only helper: create a verified user or admin with a known password.
 * @returns {Promise<{ ok: true, user: import('mongoose').Document, credentialsEmailSent: boolean } | { ok: false, status: number, error: string }>}
 */
export async function provisionVerifiedUser(request, input) {
  const email = String(input.email || '')
    .trim()
    .toLowerCase();
  const password = String(input.password || '');
  const name = String(input.name || '').trim();
  const roleRaw = String(input.role || 'admin').toLowerCase();
  const role = roleRaw === 'user' || roleRaw === 'admin' ? roleRaw : null;

  if (!role) {
    return { ok: false, status: 400, error: 'Role must be member (user) or admin.' };
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, status: 400, error: 'Valid email is required.' };
  }
  if (password.length < 8) {
    return {
      ok: false,
      status: 400,
      error: 'Password must be at least 8 characters.',
    };
  }

  await connectDB();

  const existing = await User.findOne({ email });
  if (existing) {
    return {
      ok: false,
      status: 409,
      error: 'An account with this email already exists.',
    };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await User.create({
    email,
    passwordHash,
    name,
    role,
    emailVerified: true,
    verificationOtpHash: null,
    verificationOtpExpires: null,
    deletedAt: null,
  });

  const loginUrl = loginUrlFromRequest(request);
  const mailResult = await sendProvisionedCredentials(
    email,
    password,
    name || undefined,
    loginUrl,
    role
  );

  return { ok: true, user, credentialsEmailSent: mailResult.sent };
}
