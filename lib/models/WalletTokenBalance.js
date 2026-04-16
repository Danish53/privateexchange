import mongoose from 'mongoose';

/**
 * Per-wallet, per-token balance row (proposal: separate balance per token).
 * Mutations later go through ledger + transaction engine; creation starts at 0.
 */
const WalletTokenBalanceSchema = new mongoose.Schema(
  {
    wallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wallet',
      required: true,
      index: true,
    },
    token: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Token',
      required: true,
      index: true,
    },
    balance: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

WalletTokenBalanceSchema.index({ wallet: 1, token: 1 }, { unique: true });

export default mongoose.models.WalletTokenBalance ||
  mongoose.model('WalletTokenBalance', WalletTokenBalanceSchema);
