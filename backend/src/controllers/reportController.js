/**
 * Contrôleur Reports - Signaler un profil
 */
import Report from '../models/Report.js';
import User from '../models/User.js';

export const createReport = async (req, res) => {
  try {
    const { reportedUserId, reason, description } = req.body;

    // Validation
    if (!reportedUserId) {
      return res.status(400).json({ message: 'Utilisateur à signaler requis' });
    }

    if (!reason) {
      return res.status(400).json({ message: 'Raison du signalement requise' });
    }

    // Empêcher l'auto-signalement
    if (req.user._id.toString() === reportedUserId) {
      return res.status(400).json({ message: 'Vous ne pouvez pas vous signaler vous-même' });
    }

    // Vérifier que l'utilisateur existe
    const reportedUser = await User.findById(reportedUserId);
    if (!reportedUser) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    // Vérifier si un signalement pending existe déjà
    const existing = await Report.findOne({
      reporter: req.user._id,
      reportedUser: reportedUserId,
      status: 'pending'
    });

    if (existing) {
      return res.status(400).json({ message: 'Vous avez déjà signalé cet utilisateur. Notre équipe en est notifiée.' });
    }

    // Créer le signalement
    const report = await Report.create({
      reporter: req.user._id,
      reportedUser: reportedUserId,
      reason,
      description: description?.trim() || null
    });

    res.status(201).json({ 
      message: 'Signalement enregistré et sera révisé par notre équipe dans les 24h.',
      report 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
