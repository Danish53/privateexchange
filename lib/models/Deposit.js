import mongoose from 'mongoose';

const DepositSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    token: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['paypal', 'crypto'],
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    note: {
      type: String,
      default: '',
    },
    externalRef: {
      type: String,
      default: '',
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

DepositSchema.index({ createdAt: -1 });
DepositSchema.index({ userId: 1, status: 1 });
DepositSchema.index({ paymentMethod: 1, status: 1 });

// Prevent model overwrite in development hot reload
if (process.env.NODE_ENV !== 'production' && mongoose.models.Deposit) {
  delete mongoose.models.Deposit;
}

export default mongoose.models.Deposit || mongoose.model('Deposit', DepositSchema);