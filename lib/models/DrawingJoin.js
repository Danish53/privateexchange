import mongoose from 'mongoose';

const DrawingJoinSchema = new mongoose.Schema(
  {
    drawingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Drawing', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    entryTokenId: { type: mongoose.Schema.Types.ObjectId, ref: 'Token', required: true },
    entryTokenSymbol: { type: String, required: true, trim: true, uppercase: true },
    entryCost: { type: Number, required: true, min: 0 },
    balanceBefore: { type: Number, required: true, min: 0 },
    balanceAfter: { type: Number, required: true, min: 0 },
    note: { type: String, default: '' },
  },
  { timestamps: true }
);

// One user can join one drawing once.
DrawingJoinSchema.index({ drawingId: 1, userId: 1 }, { unique: true });
DrawingJoinSchema.index({ drawingId: 1, createdAt: -1 });

if (process.env.NODE_ENV !== 'production' && mongoose.models.DrawingJoin) {
  delete mongoose.models.DrawingJoin;
}

export default mongoose.models.DrawingJoin || mongoose.model('DrawingJoin', DrawingJoinSchema);

