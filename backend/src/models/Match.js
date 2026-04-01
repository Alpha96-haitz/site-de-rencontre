/**
 * Modèle Match - Like et correspondances mutuelles
 */
import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema(
  {
    users: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }],
    likedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    likedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    isMutual: {
      type: Boolean,
      default: false
    },
    matchedAt: Date
  },
  { timestamps: true }
);

matchSchema.index({ likedBy: 1, likedUser: 1 }, { unique: true });
matchSchema.index({ users: 1 });

export default mongoose.model('Match', matchSchema);
