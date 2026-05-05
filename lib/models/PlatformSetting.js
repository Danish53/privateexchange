import mongoose from 'mongoose';

const PlatformSettingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true, default: 'global' },
    transferFeeAmount: { type: Number, default: 0.5, min: 0 },
    transferFeeType: { type: String, enum: ['fixed', 'percentage'], default: 'fixed' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

export default mongoose.models.PlatformSetting ||
  mongoose.model('PlatformSetting', PlatformSettingSchema);
