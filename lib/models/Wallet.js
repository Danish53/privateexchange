import mongoose from 'mongoose';

/** One custodial wallet per member user (role `user`). */
const WalletSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Wallet || mongoose.model('Wallet', WalletSchema);
