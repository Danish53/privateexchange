import mongoose from 'mongoose';

const SupportTicketSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    detail: { type: String, required: true, trim: true, maxlength: 8000 },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'resolved', 'closed'],
      default: 'pending',
      index: true,
    },
    adminReply: { type: String, default: null, maxlength: 8000 },
    repliedAt: { type: Date, default: null },
    repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

SupportTicketSchema.index({ createdAt: -1 });

if (process.env.NODE_ENV !== 'production' && mongoose.models.SupportTicket) {
  delete mongoose.models.SupportTicket;
}

export default mongoose.models.SupportTicket ||
  mongoose.model('SupportTicket', SupportTicketSchema);
