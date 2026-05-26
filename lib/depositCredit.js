import mongoose from 'mongoose';
import Deposit from '@/lib/models/Deposit';
import Wallet from '@/lib/models/Wallet';
import Token from '@/lib/models/Token';
import WalletTokenBalance from '@/lib/models/WalletTokenBalance';
import LedgerEntry from '@/lib/models/LedgerEntry';

/**
 * Credit a pending deposit to the member wallet (idempotent).
 * @param {string} depositId
 * @param {{ ledgerNote?: string, completedNote?: string }} [options]
 */
export async function creditDepositById(depositId, options = {}) {
  const ledgerNote = options.ledgerNote || 'Deposit confirmed and credited';
  const completedNote = options.completedNote || 'Payment confirmed and wallet credited';

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const locked = await Deposit.findById(depositId).session(session);
      if (!locked) throw new Error('Deposit not found.');
      if (locked.status === 'completed' && locked.creditedAt) return;

      const wallet = await Wallet.findOne({ user: locked.userId }).session(session);
      if (!wallet) throw new Error('Wallet not found.');

      const tokenDoc = await Token.findOne({
        symbol: locked.token.toUpperCase(),
        isActive: true,
      })
        .select('_id symbol')
        .session(session);
      if (!tokenDoc) throw new Error('Token not found.');

      const updatedBalanceDoc = await WalletTokenBalance.findOneAndUpdate(
        { wallet: wallet._id, token: tokenDoc._id },
        { $inc: { balance: locked.amount } },
        { new: true, upsert: true, session, setDefaultsOnInsert: true }
      );

      await LedgerEntry.create(
        [
          {
            userId: locked.userId,
            type: 'deposit',
            token: locked.token.toUpperCase(),
            amount: locked.amount,
            direction: 'credit',
            note: ledgerNote,
            balanceAfter: Number(updatedBalanceDoc?.balance || 0),
            externalRef:
              locked.paypalCaptureId ||
              locked.paypalOrderId ||
              locked.stripePaymentIntentId ||
              locked.stripeSessionId ||
              String(locked._id),
          },
        ],
        { session, ordered: true }
      );

      locked.status = 'completed';
      locked.creditedAt = new Date();
      locked.note = completedNote;
      locked.externalRef =
        locked.paypalCaptureId ||
        locked.paypalOrderId ||
        locked.stripePaymentIntentId ||
        locked.stripeSessionId ||
        locked.externalRef ||
        '';
      await locked.save({ session });
    });
  } finally {
    await session.endSession();
  }
}
