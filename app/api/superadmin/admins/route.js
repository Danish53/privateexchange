import { NextResponse } from 'next/server';
import { requireSuperAdmin, serializeUser } from '@/lib/authHelpers';
import { provisionVerifiedUser } from '@/lib/superadminProvisionUser';

export const runtime = 'nodejs';

/**
 * Superadmin-only: create a verified admin account that can sign in immediately.
 */
export async function POST(request) {
  try {
    const auth = await requireSuperAdmin(request);
    if ('error' in auth) return auth.error;

    const body = await request.json().catch(() => ({}));
    const result = await provisionVerifiedUser(request, {
      email: body.email,
      password: body.password,
      name: body.name,
      role: 'admin',
      adminPermissions: body.adminPermissions,
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
    }

    const mailResult = result.credentialsEmailSent;
    return NextResponse.json({
      ok: true,
      user: serializeUser(result.user),
      message: mailResult
        ? 'Admin created. Login details were sent to their email.'
        : 'Admin created. Configure SMTP to email them credentials automatically; they can still sign in with the password you set.',
      credentialsEmailSent: mailResult,
    });
  } catch (e) {
    console.error('superadmin/admins POST', e);
    return NextResponse.json({ ok: false, error: 'Failed to create admin.' }, { status: 500 });
  }
}
