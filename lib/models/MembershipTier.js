import mongoose from 'mongoose';

const MembershipTierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    /** Derived from `name` on create; unique for URLs and lookups. */
    slug: {
      type: String,
      lowercase: true,
      trim: true,
      maxlength: 128,
      sparse: true,
      unique: true,
      index: true,
    },
    minValueUsd: { type: Number, required: true, min: 0, index: true },
    /** Tier feature flags (exposed on API as snake_case). */
    transferFee: { type: Boolean, default: false },
    vipDrawings: { type: Boolean, default: false },
    executiveEvents: { type: Boolean, default: false },
    prioritySupport: { type: Boolean, default: false },
    benefits: {
      type: [{ type: String, trim: true, maxlength: 500 }],
      default: [],
      validate: {
        validator(arr) {
          return Array.isArray(arr) && arr.length > 0 && arr.every((s) => typeof s === 'string' && s.trim().length > 0);
        },
        message: 'At least one non-empty benefit is required.',
      },
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

MembershipTierSchema.index({ minValueUsd: 1, name: 1 });

if (process.env.NODE_ENV !== 'production' && mongoose.models.MembershipTier) {
  delete mongoose.models.MembershipTier;
}

export default mongoose.models.MembershipTier ||
  mongoose.model('MembershipTier', MembershipTierSchema);
