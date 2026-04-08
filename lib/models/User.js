import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, default: '' },
    /** Public URL path e.g. /uploads/avatars/abc.jpg */
    avatarUrl: { type: String, default: '' },
    phone: { type: String, default: '' },
    country: { type: String, default: '' },
    timezone: { type: String, default: '' },
    role: { type: String, enum: ['user', 'admin', 'superadmin'], default: 'user' },
    emailVerified: { type: Boolean, default: false },
    verificationOtpHash: { type: String, default: null },
    verificationOtpExpires: { type: Date, default: null },
    resetPasswordOtpHash: { type: String, default: null },
    resetPasswordOtpExpires: { type: Date, default: null },
    /** Soft-delete: set when superadmin archives an account; login blocked until restored */
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model('User', UserSchema);
