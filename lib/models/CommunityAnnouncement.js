import mongoose from 'mongoose';

const CommunityAnnouncementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['drawing_launch', 'drawing_result', 'maintenance', 'wallet_token', 'membership', 'security', 'policy', 'promotion', 'general'],
      default: 'general',
      index: true,
    },
    audience: {
      type: String,
      enum: ['all_users', 'vip_only', 'non_vip_only'],
      default: 'all_users',
      index: true,
    },
    priority: { type: String, enum: ['normal', 'high', 'critical'], default: 'normal', index: true },
    summary: { type: String, required: true, trim: true },
    details: { type: String, required: true, trim: true },
    startsAt: { type: Date, required: true, index: true },
    endsAt: { type: Date, default: null },
    cta: {
      label: { type: String, default: '' },
      url: { type: String, default: '' },
    },
    channels: {
      dashboardBanner: { type: Boolean, default: true },
      inAppNotice: { type: Boolean, default: true },
      emailNotice: { type: Boolean, default: false },
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

CommunityAnnouncementSchema.index({ createdAt: -1 });

if (process.env.NODE_ENV !== 'production' && mongoose.models.CommunityAnnouncement) {
  delete mongoose.models.CommunityAnnouncement;
}

export default mongoose.models.CommunityAnnouncement ||
  mongoose.model('CommunityAnnouncement', CommunityAnnouncementSchema);
