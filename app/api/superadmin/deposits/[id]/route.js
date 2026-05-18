import { NextResponse } from 'next/server';
import { loadRequestActor } from '@/lib/authHelpers';
import { connectDB } from '@/lib/db';
import Deposit from '@/lib/models/Deposit';
import LedgerEntry from '@/lib/models/LedgerEntry';
import Wallet from '@/lib/models/Wallet';
import WalletTokenBalance from '@/lib/models/WalletTokenBalance';
import Token from '@/lib/models/Token';
import { userHasWalletsAdjust } from '@/lib/adminPermissions';
import { ensureWalletForMemberUser } from '@/lib/walletService';

export const runtime = 'nodejs';

/**
 * PATCH /api/superadmin/deposits/:id
 * Approve or cancel a pending deposit.
 * Body: { action: 'approve' | 'cancel', note?: string, creditToken?: string, creditAmount?: number }
 */
export async function PATCH(request, context) {
  try {
    const auth = await loadRequestActor(request);
    if ('error' in auth) return auth.error;

    // Only superadmin or admin with wallets adjust permission can access
    if (!userHasWalletsAdjust(auth.user)) {
      return NextResponse.json(
        { ok: false, error: 'Insufficient permissions.' },
        { status: 403 }
      );
    }

    await connectDB();

    const params = await Promise.resolve(context.params);
    const depositId = params?.id;
    if (!depositId || typeof depositId !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'Deposit ID is required.' },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { action, note, creditToken, creditAmount } = body;

    if (!action || !['approve', 'cancel'].includes(action)) {
      return NextResponse.json(
        { ok: false, error: 'Action must be "approve" or "cancel".' },
        { status: 400 }
      );
    }

    const deposit = await Deposit.findById(depositId);
    if (!deposit) {
      return NextResponse.json(
        { ok: false, error: 'Deposit not found.' },
        { status: 404 }
      );
    }

    // Only pending deposits can be approved/cancelled
    if (deposit.status !== 'pending') {
      return NextResponse.json(
        { ok: false, error: `Deposit is already ${deposit.status}.` },
        { status: 400 }
      );
    }

    if (deposit.paymentMethod === 'crypto' && deposit.nowPaymentsPaymentId) {
      return NextResponse.json(
        { ok: false, error: 'Automated NowPayments crypto deposits cannot be approved manually.' },
        { status: 400 }
      );
    }

    const newStatus = action === 'approve' ? 'completed' : 'cancelled';
    const adminNote = note?.trim() || (action === 'approve' ? 'Admin approved' : 'Admin cancelled');

    let creditedTokenSymbol = deposit.token.toUpperCase();
    let creditedAmount = deposit.amount;

    if (action === 'approve') {
      creditedTokenSymbol = String(creditToken || deposit.token || 'USD')
        .trim()
        .toUpperCase();
      creditedAmount =
        creditAmount != null && creditAmount !== ''
          ? Number(creditAmount)
          : Number(deposit.amount);

      if (!creditedTokenSymbol) {
        return NextResponse.json(
          { ok: false, error: 'Credit token is required.' },
          { status: 400 }
        );
      }
      if (!Number.isFinite(creditedAmount) || creditedAmount <= 0) {
        return NextResponse.json(
          { ok: false, error: 'Enter a valid positive credit amount.' },
          { status: 400 }
        );
      }

      await ensureWalletForMemberUser(deposit.userId);

      const wallet = await Wallet.findOne({ user: deposit.userId });
      if (!wallet) {
        return NextResponse.json(
          { ok: false, error: 'User wallet not found.' },
          { status: 500 }
        );
      }

      const tokenDoc = await Token.findOne({
        symbol: creditedTokenSymbol,
        isActive: true,
      }).lean();
      if (!tokenDoc) {
        return NextResponse.json(
          { ok: false, error: `Token ${creditedTokenSymbol} not found or inactive.` },
          { status: 400 }
        );
      }

      let wtb = await WalletTokenBalance.findOne({
        wallet: wallet._id,
        token: tokenDoc._id,
      });

      if (!wtb) {
        wtb = await WalletTokenBalance.create({
          wallet: wallet._id,
          token: tokenDoc._id,
          balance: 0,
        });
      }

      const updated = await WalletTokenBalance.findByIdAndUpdate(
        wtb._id,
        { $inc: { balance: creditedAmount } },
        { new: true }
      );

      const balanceAfter = Number(updated.balance) || 0;

      await LedgerEntry.create({
        userId: deposit.userId,
        type: 'deposit',
        token: creditedTokenSymbol,
        amount: creditedAmount,
        direction: 'credit',
        note: `${deposit.paymentMethod === 'crypto' ? 'Crypto' : 'PayPal'} deposit approved by admin (${creditedAmount} ${creditedTokenSymbol}): ${adminNote}`,
        balanceAfter,
        externalRef: deposit._id.toString(),
      });

      deposit.token = creditedTokenSymbol;
      deposit.amount = creditedAmount;
      deposit.creditedAt = new Date();
    }

    deposit.status = newStatus;
    deposit.note = `${deposit.note} | ${adminNote}`;
    deposit.approvedAt = new Date();
    deposit.approvedBy = auth.userId;
    await deposit.save();

    return NextResponse.json({
      ok: true,
      deposit: {
        id: deposit._id,
        status: deposit.status,
        approvedAt: deposit.approvedAt,
        approvedBy: deposit.approvedBy,
        note: deposit.note,
      },
      credited:
        action === 'approve'
          ? { token: creditedTokenSymbol, amount: creditedAmount }
          : null,
      message:
        action === 'approve'
          ? `Deposit approved. ${creditedAmount} ${creditedTokenSymbol} credited to user wallet.`
          : 'Deposit cancelled.',
    });
  } catch (e) {
    console.error('superadmin/deposits/[id] PATCH', e);
    return NextResponse.json(
      { ok: false, error: 'Failed to update deposit.' },
      { status: 500 }
    );
  }
}