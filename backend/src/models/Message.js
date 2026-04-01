/**
 * Modèle Message - Chat entre utilisateurs matchés
 */
import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    match: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Match',
      required: true
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      trim: true,
      maxlength: 2000
    },
    image: {
      url: String,
      publicId: String
    },
    readBy: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      readAt: { type: Date, default: Date.now }
    }]
  },
  { timestamps: true }
);

messageSchema.index({ match: 1, createdAt: -1 });

export default mongoose.model('Message', messageSchema);
