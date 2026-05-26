import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Deposit from '@/lib/models/Deposit';
import { creditDepositById } from '@/lib/depositCredit';

export const runtime = 'nodejs';

/**
 * POST /api/webhooks/paypal
 * Optional backup: credit deposit when PayPal sends CHECKOUT.ORDER.APPROVED / PAYMENT.CAPTURE.COMPLETED
 */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const eventType = String(body?.event_type || '');
    const resource = body?.resource || {};

    const orderId = String(
      resource?.id ||
        resource?.supplementary_data?.related_ids?.order_id ||
        body?.resource?.supplementary_data?.related_ids?.order_id ||
        ''
    ).trim();

    if (!orderId) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const relevant =
      eventType === 'CHECKOUT.ORDER.APPROVED' ||
      eventType === 'PAYMENT.CAPTURE.COMPLETED' ||
      eventType === 'CHECKOUT.ORDER.COMPLETED';

    if (!relevant) {
      return NextResponse.json({ ok: true, ignored: true, eventType });
    }

    await connectDB();
    const deposit = await Deposit.findOne({
      paypalOrderId: orderId,
      paymentMethod: 'paypal',
    });

    if (!deposit) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    if (deposit.status === 'completed' && deposit.creditedAt) {
      return NextResponse.json({ ok: true, alreadyCredited: true });
    }

    const captureId = String(resource?.id || deposit.paypalCaptureId || '');
    if (captureId) {
      deposit.paypalCaptureId = captureId;
      deposit.externalRef = captureId;
    }
    deposit.paypalPaymentStatus = 'COMPLETED';
    await deposit.save();

    await creditDepositById(deposit._id, {
      ledgerNote: 'PayPal deposit confirmed (webhook) and credited',
      completedNote: 'PayPal payment confirmed and wallet credited',
    });

    return NextResponse.json({ ok: true, status: 'completed' });
  } catch (e) {
    console.error('webhooks/paypal POST', e);
    return NextResponse.json({ ok: false, error: 'Webhook processing failed.' }, { status: 500 });
  }
}
