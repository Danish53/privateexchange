import { NextResponse } from 'next/server';
import { syncAutomaticMembershipForAllUsers } from '@/lib/userMembershipAssignmentService';

export const runtime = 'nodejs';

/** Vercel / external cron: allow long runs on Pro (adjust if needed). */
export const maxDuration = 300;

/**
 * Scheduled membership sync: recomputes portfolio-based automatic tier + VIP for every member.
 *
 * **Security:** send `Authorization: Bearer <CRON_SECRET>` (matches Vercel Cron). Set `CRON_SECRET` in env.
 *
 * **Vercel:** add this path in Project → Settings → Cron Jobs, or use `vercel.json` `crons` (see repo root).
 * **Other hosts:** `curl -fsS -H "Authorization: Bearer $CRON_SECRET" "https://your-domain/api/cron/membership-sync"`
 */
export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || String(secret).trim().length < 8) {
    return NextResponse.json(
      { ok: false, error: 'CRON_SECRET is not set or too short (min 8 chars).' },
      { status: 503 }
    );
  }

  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await syncAutomaticMembershipForAllUsers();
    return NextResponse.json(result);
  } catch (e) {
    console.error('cron/membership-sync', e);
    return NextResponse.json({ ok: false, error: 'Membership sync failed.' }, { status: 500 });
  }
}
