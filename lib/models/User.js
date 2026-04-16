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
    /** Granular platform UI/API access for role `admin` only (superadmin ignores). */
    adminPermissions: {
      usersView: { type: Boolean, default: false },
      usersCreate: { type: Boolean, default: false },
      usersEdit: { type: Boolean, default: false },
      usersDelete: { type: Boolean, default: false },
      walletsView: { type: Boolean, default: false },
      walletsAdjust: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

/**
 * Next.js dev hot reload can keep an older User schema in memory (missing newer nested paths).
 * Drop the cached model in development so `walletsView` / `walletsAdjust` are always registered.
 */
if (process.env.NODE_ENV !== 'production' && mongoose.models.User) {
  delete mongoose.models.User;
}

export default mongoose.models.User || mongoose.model('User', UserSchema);
