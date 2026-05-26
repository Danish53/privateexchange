import { NextResponse } from 'next/server';
import { loadRequestActor } from '@/lib/authHelpers';
import { connectDB } from '@/lib/db';
import Deposit from '@/lib/models/Deposit';
import {
  extractPayPalErrorMessage,
  finalizePayPalDepositOrder,
  isPayPalConfigured,
} from '@/lib/paypal';
import { creditDepositById } from '@/lib/depositCredit';

export const runtime = 'nodejs';

/**
 * POST /api/user/deposit/paypal/capture
 * Body: { depositId: string, orderId: string }
 *
 * Primary PayPal completion path — no webhook required.
 * Called from the browser after PayPal approve; captures the order and credits USD via creditDepositById.
 */
export async function POST(request) {
  try {
    const auth = await loadRequestActor(request);
    if ('error' in auth) return auth.error;

    if (auth.user?.role !== 'user') {
      return NextResponse.json(
        { ok: false, error: 'Only member accounts can complete PayPal deposits.' },
        { status: 403 }
      );
    }

    if (!isPayPalConfigured()) {
      return NextResponse.json(
        { ok: false, error: 'PayPal deposits are temporarily unavailable.' },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const depositId = String(body.depositId || '').trim();
    const orderId = String(body.orderId || '').trim();

    if (!depositId || !orderId) {
      return NextResponse.json(
        { ok: false, error: 'depositId and orderId are required.' },
        { status: 400 }
      );
    }

    await connectDB();
    const deposit = await Deposit.findById(depositId);
    if (!deposit) {
      return NextResponse.json({ ok: false, error: 'Deposit not found.' }, { status: 404 });
    }

    if (String(deposit.userId) !== String(auth.userId)) {
      return NextResponse.json({ ok: false, error: 'Deposit not found.' }, { status: 404 });
    }

    if (deposit.paymentMethod !== 'paypal') {
      return NextResponse.json({ ok: false, error: 'Invalid deposit payment method.' }, { status: 400 });
    }

    if (deposit.status === 'completed' && deposit.creditedAt) {
      return NextResponse.json({
        ok: true,
        alreadyCompleted: true,
        deposit: {
          id: String(deposit._id),
          status: deposit.status,
          amount: deposit.amount,
          token: deposit.token,
        },
        message: 'Deposit already credited.',
      });
    }

    if (deposit.paypalOrderId && deposit.paypalOrderId !== orderId) {
      return NextResponse.json(
        { ok: false, error: 'Order id does not match this deposit. Start a new payment.' },
        { status: 400 }
      );
    }

    let finalized;
    try {
      finalized = await finalizePayPalDepositOrder(orderId);
    } catch (err) {
      const msg = extractPayPalErrorMessage(err);
      const code = err?.code || 'PAYPAL_CAPTURE_FAILED';
      if (deposit.status !== 'completed') {
        deposit.paypalOrderId = orderId;
        deposit.paypalPaymentStatus = code;
        deposit.note = `PayPal failed: ${msg}`;
        if (code === 'PAYPAL_DECLINED') deposit.status = 'cancelled';
        await deposit.save();
      }
      const status =
        code === 'PAYER_CANNOT_PAY' ? 422 : code === 'PAYPAL_ORDER_NOT_READY' ? 409 : 502;
      return NextResponse.json(
        {
          ok: false,
          error: msg,
          code,
          debugId: err?.paypal?.debug_id || null,
        },
        { status }
      );
    }

    const { captureInfo } = finalized;
    deposit.paypalOrderId = orderId;
    deposit.paypalCaptureId = captureInfo.captureId;
    deposit.paypalPaymentStatus = captureInfo.status || captureInfo.orderStatus;
    deposit.externalRef = captureInfo.captureId || orderId;
    await deposit.save();

    await creditDepositById(deposit._id, {
      ledgerNote: 'PayPal card deposit confirmed and credited',
      completedNote: 'PayPal payment confirmed and wallet credited',
    });

    const updated = await Deposit.findById(deposit._id).lean();

    return NextResponse.json({
      ok: true,
      deposit: {
        id: String(updated._id),
        amount: updated.amount,
        token: updated.token,
        status: updated.status,
        paymentMethod: updated.paymentMethod,
        creditedAt: updated.creditedAt,
        paypalOrderId: updated.paypalOrderId,
        paypalCaptureId: updated.paypalCaptureId,
      },
      message: `${updated.amount} ${updated.token} credited to your wallet.`,
    });
  } catch (e) {
    console.error('user/deposit/paypal/capture POST', e);
    return NextResponse.json(
      { ok: false, error: e?.message || 'Failed to capture PayPal payment.' },
      { status: 500 }
    );
  }
}
