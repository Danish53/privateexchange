import { NextResponse } from 'next/server';
import { loadRequestActor } from '@/lib/authHelpers';
import {
  extractPayPalErrorMessage,
  generatePayPalClientToken,
  getPayPalEnvironment,
  getPayPalPublicClientId,
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

    const serverClientId = String(process.env.PAYPAL_CLIENT_ID || '').trim();
    const publicClientId = getPayPalPublicClientId();
    const environment = getPayPalEnvironment();

    let clientTokenOk = false;
    let clientTokenError = null;
    if (isPayPalConfigured()) {
      try {
        await generatePayPalClientToken(String(auth.userId || auth.user?._id || 'guest'));
        clientTokenOk = true;
      } catch (e) {
        clientTokenError = extractPayPalErrorMessage(e);
      }
    }

    return NextResponse.json({
      ok: true,
      configured: isPayPalConfigured(),
      environment,
      publicClientIdSet: Boolean(publicClientId),
      publicClientIdMatchesServer:
        Boolean(serverClientId && publicClientId && serverClientId === publicClientId),
      clientTokenOk,
      clientTokenError,
      advancedCardsRequired: true,
      devErrorMeaning:
        'ERR_DEV_RECEIVED_CLIENT_ERROR_RESPONSE means PayPal rejected on-page card fields. Enable Advanced Credit and Debit Card Payments on the SAME REST app Client ID you use in .env.',
    });
  } catch (e) {
    console.error('user/deposit/paypal/setup-status GET', e);
    return NextResponse.json(
      { ok: false, error: extractPayPalErrorMessage(e) },
      { status: 500 }
    );
  }
}
