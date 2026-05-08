import mongoose from 'mongoose';

const CommunityAnnouncementViewSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    announcementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CommunityAnnouncement',
      required: true,
      index: true,
    },
    viewedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

CommunityAnnouncementViewSchema.index({ userId: 1, announcementId: 1 }, { unique: true });

if (process.env.NODE_ENV !== 'production' && mongoose.models.CommunityAnnouncementView) {
  delete mongoose.models.CommunityAnnouncementView;
}

export default mongoose.models.CommunityAnnouncementView ||
  mongoose.model('CommunityAnnouncementView', CommunityAnnouncementViewSchema);
