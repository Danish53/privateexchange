import { NextResponse } from 'next/server';
import { loadRequestActor } from '@/lib/authHelpers';
import {
  extractPayPalErrorMessage,
  generatePayPalClientToken,
  isPayPalConfigured,
} from '@/lib/paypal';

export const runtime = 'nodejs';

export async function GET(request) {
  try {
    const auth = await loadRequestActor(request);
    if ('error' in auth) return auth.error;

    if (auth.user?.role !== 'user') {
      return NextResponse.json(
        { ok: false, error: 'Only member accounts can use PayPal deposits.' },
        { status: 403 }
      );
    }

    if (!isPayPalConfigured()) {
      return NextResponse.json(
        { ok: false, error: 'PayPal is not configured on the server.' },
        { status: 503 }
      );
    }

    const { clientToken, expiresIn } = await generatePayPalClientToken(
      String(auth.userId || auth.user?._id || 'guest')
    );

    return NextResponse.json({ ok: true, clientToken, expiresIn });
  } catch (e) {
    console.error('user/deposit/paypal/client-token GET', e);
    return NextResponse.json(
      { ok: false, error: extractPayPalErrorMessage(e) },
      { status: e?.statusCode && e.statusCode < 500 ? e.statusCode : 502 }
    );
  }
}
