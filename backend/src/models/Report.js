/**
 * Modèle Report - Signaler un utilisateur ou un profil
 */
import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reportedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reason: {
      type: String,
      enum: [
        'Harcèlement ou intimidation',
        'Discours haineux ou injurieux',
        'Faux profil ou spam',
        'Contenu inapproprié ou sexuel',
        'Incite à la haine ou à la violence',
        'Autre'
      ],
      required: true
    },
    description: String,
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'action_taken', 'dismissed'],
      default: 'pending'
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date
  },
  { timestamps: true }
);

reportSchema.index({ reportedUser: 1, status: 1 });

export default mongoose.model('Report', reportSchema);
