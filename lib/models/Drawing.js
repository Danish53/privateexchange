import mongoose from 'mongoose';
import '@/lib/models/Token';

const DrawingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },

    description: { type: String, default: null },

    prize_title: { type: String, required: true, trim: true },
    prize_description: { type: String, default: null },
    prize_image: { type: String, default: null },

    reward_type: {
      type: String,
      enum: ['physical', 'token', 'event_access', 'custom'],
      default: 'physical',
      index: true,
    },
    reward_token_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Token', default: null },
    reward_token_amount: { type: mongoose.Schema.Types.Decimal128, default: '0' },

    entry_token_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Token', default: null },
    entry_cost: { type: mongoose.Schema.Types.Decimal128, required: true, default: '0' },

    max_entries_per_user: { type: Number, default: null },
    total_entries: { type: Number, default: 0, min: 0 },

    draw_date: { type: Date, default: null, index: true },

    status: {
      type: String,
      enum: ['pending', 'active', 'completed'],
      default: 'active',
      index: true,
    },

    winner_user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

DrawingSchema.index({ createdAt: -1 });
DrawingSchema.index({ status: 1, draw_date: 1 });

// Prevent model overwrite/cache issues during development hot reload.
if (process.env.NODE_ENV !== 'production' && mongoose.models.Drawing) {
  delete mongoose.models.Drawing;
}

export default mongoose.models.Drawing || mongoose.model('Drawing', DrawingSchema);

