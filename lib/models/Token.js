import mongoose from 'mongoose';

const TokenSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    symbol: { type: String, required: true, trim: true },
    sortOrder: { type: Number, default: 0 },
    /** Display / reporting only until pricing engine */
    usdPerUnit: { type: Number, default: 1, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

TokenSchema.index({ sortOrder: 1 });

export default mongoose.models.Token || mongoose.model('Token', TokenSchema);
