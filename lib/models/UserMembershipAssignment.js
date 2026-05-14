import mongoose from 'mongoose';

/**
 * Links a member (role user) to a configured membership tier.
 * assignmentType `manual` = set by superadmin from the users UI.
 */
const UserMembershipAssignmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    membershipTier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MembershipTier',
      required: true,
      index: true,
    },
    assignmentType: {
      type: String,
      enum: ['manual', 'automatic'],
      default: 'automatic',
      index: true,
    },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

UserMembershipAssignmentSchema.index({ membershipTier: 1 });

if (process.env.NODE_ENV !== 'production' && mongoose.models.UserMembershipAssignment) {
  delete mongoose.models.UserMembershipAssignment;
}

export default mongoose.models.UserMembershipAssignment ||
  mongoose.model('UserMembershipAssignment', UserMembershipAssignmentSchema);
