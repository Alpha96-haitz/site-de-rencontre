/**
 * Contrôleur Reports - Signaler un profil
 */
import Report from '../models/Report.js';

export const createReport = async (req, res) => {
  try {
    const { reportedUserId, reason, description } = req.body;
    const existing = await Report.findOne({
      reporter: req.user._id,
      reportedUser: reportedUserId,
      status: 'pending'
    });
    if (existing) {
      return res.status(400).json({ message: 'Déjà signalé' });
    }
    await Report.create({
      reporter: req.user._id,
      reportedUser: reportedUserId,
      reason,
      description
    });
    res.status(201).json({ message: 'Signalement enregistré' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
