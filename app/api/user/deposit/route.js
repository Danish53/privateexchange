import { NextResponse } from 'next/server';
import { loadRequestActor } from '@/lib/authHelpers';
import { connectDB } from '@/lib/db';
import Deposit from '@/lib/models/Deposit';
import LedgerEntry from '@/lib/models/LedgerEntry';
import { ensureWalletForMemberUser } from '@/lib/walletService';
import WalletTokenBalance from '@/lib/models/WalletTokenBalance';
import Token from '@/lib/models/Token';
import Wallet from '@/lib/models/Wallet';

export const runtime = 'nodejs';

/**
 * POST /api/user/deposit
 * Create a deposit request (pending for PayPal, auto‑completed for crypto).
 * Body: { amount: number, token: string, paymentMethod: 'paypal' | 'crypto' }
 */
export async function POST(request) {
  try {
    const auth = await loadRequestActor(request);
    if ('error' in auth) return auth.error;

    // Only regular members can deposit
    if (auth.user?.role !== 'user') {
      return NextResponse.json(
        { ok: false, error: 'Only member accounts can deposit.' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { amount, token, paymentMethod } = body;

    // Validate required fields
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { ok: false, error: 'Valid positive amount is required.' },
        { status: 400 }
      );
    }
    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'Token symbol is required.' },
        { status: 400 }
      );
    }
    if (!paymentMethod || !['paypal', 'crypto'].includes(paymentMethod)) {
      return NextResponse.json(
        { ok: false, error: 'Payment method must be paypal or crypto.' },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify token exists and is active
    const tokenDoc = await Token.findOne({
      symbol: token.toUpperCase(),
      isActive: true,
    }).lean();
    if (!tokenDoc) {
      return NextResponse.json(
        { ok: false, error: 'Token not found or inactive.' },
        { status: 400 }
      );
    }

    // Ensure user has a wallet
    await ensureWalletForMemberUser(auth.userId);

    // Determine status: crypto => completed, paypal => pending
    const isCrypto = paymentMethod === 'crypto';
    const status = isCrypto ? 'completed' : 'pending';

    // Create deposit record
    const deposit = await Deposit.create({
      userId: auth.userId,
      amount,
      token: token.toUpperCase(),
      paymentMethod,
      status,
      note: isCrypto ? 'Crypto deposit (auto‑approved)' : 'PayPal deposit (pending admin approval)',
      externalRef: '',
    });

    // If crypto, immediately credit the wallet and create ledger entry
    if (isCrypto) {
      // Get user's wallet
      const wallet = await Wallet.findOne({ user: auth.userId });
      if (!wallet) {
        // Should not happen because ensureWalletForMemberUser was called
        return NextResponse.json(
          { ok: false, error: 'Wallet not found' },
          { status: 500 }
        );
      }

      // Find or create wallet token balance row
      let wtb = await WalletTokenBalance.findOne({
        wallet: wallet._id,
        token: tokenDoc._id,
      });
      
      if (!wtb) {
        // Create new balance row with zero balance
        wtb = await WalletTokenBalance.create({
          wallet: wallet._id,
          token: tokenDoc._id,
          balance: 0,
        });
      }

      // Update balance
      const updated = await WalletTokenBalance.findByIdAndUpdate(
        wtb._id,
        { $inc: { balance: amount } },
        { new: true }
      );

      const balanceAfter = Number(updated.balance) || 0;

      // Create ledger entry
      await LedgerEntry.create({
        userId: auth.userId,
        type: 'deposit',
        token: token.toUpperCase(),
        amount,
        direction: 'credit',
        note: `Crypto deposit via ${token.toUpperCase()} (auto‑approved)`,
        balanceAfter,
        externalRef: deposit._id.toString(),
      });

      // Update deposit with ledger reference
      deposit.externalRef = `ledger:${deposit._id}`;
      await deposit.save();
    }

    // Return success with deposit details
    return NextResponse.json({
      ok: true,
      deposit: {
        id: deposit._id,
        amount: deposit.amount,
        token: deposit.token,
        paymentMethod: deposit.paymentMethod,
        status: deposit.status,
        note: deposit.note,
        createdAt: deposit.createdAt,
      },
      message: isCrypto
        ? 'Crypto deposit completed. Funds have been added to your wallet.'
        : 'PayPal deposit request submitted. It will be processed after admin approval.',
    });
  } catch (e) {
    console.error('user/deposit POST', e);
    return NextResponse.json(
      { ok: false, error: 'Failed to create deposit.' },
      { status: 500 }
    );
  }
}