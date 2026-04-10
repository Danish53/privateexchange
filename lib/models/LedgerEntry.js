import mongoose from 'mongoose';

/**
 * Append-only ledger line per proposal: deposits, transfers, fees, admin credits/debits.
 * Balances are derived from entries; do not mutate amounts after insert.
 */
const LedgerEntrySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      required: true,
      enum: ['deposit', 'withdrawal', 'transfer', 'fee', 'admin_credit', 'admin_debit'],
      index: true,
    },
    /** Token code e.g. 759, Cristalino, Raffle */
    token: { type: String, required: true, trim: true, uppercase: true, index: true },
    /** Always positive magnitude */
    amount: { type: Number, required: true, min: 0 },
    direction: { type: String, required: true, enum: ['credit', 'debit'] },
    counterpartyUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    externalRef: { type: String, default: '' },
    /** Admin / system note for audit */
    note: { type: String, default: '' },
    /** Optional post-tx balance hint for one token (when engine supplies it) */
    balanceAfter: { type: Number, default: null },
  },
  { timestamps: true }
);

LedgerEntrySchema.index({ createdAt: -1 });
LedgerEntrySchema.index({ userId: 1, createdAt: -1 });
LedgerEntrySchema.index({ type: 1, createdAt: -1 });

export default mongoose.models.LedgerEntry || mongoose.model('LedgerEntry', LedgerEntrySchema);
