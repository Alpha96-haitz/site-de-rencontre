/**
 * Controleur Reports - Signaler un profil
 */
import Report from '../models/Report.js';
import User from '../models/User.js';
import { createNotification } from './notificationController.js';

export const createReport = async (req, res) => {
  try {
    const { reportedUserId, reason, description } = req.body;

    if (!reportedUserId) {
      return res.status(400).json({ message: 'Utilisateur a signaler requis' });
    }
    if (!reason) {
      return res.status(400).json({ message: 'Raison du signalement requise' });
    }

    if (req.user._id.toString() === reportedUserId) {
      return res.status(400).json({ message: 'Vous ne pouvez pas vous signaler vous-meme' });
    }

    const reportedUser = await User.findById(reportedUserId);
    if (!reportedUser) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    const existing = await Report.findOne({
      reporter: req.user._id,
      reportedUser: reportedUserId,
      status: 'pending'
    });

    if (existing) {
      return res.status(400).json({ message: 'Vous avez deja signale cet utilisateur. Notre equipe en est notifiee.' });
    }

    const cleanReason = String(reason || '').trim();
    const cleanDescription = description ? String(description).trim() : '';

    const report = await Report.create({
      reporter: req.user._id,
      reportedUser: reportedUserId,
      reason: cleanReason,
      description: cleanDescription || null
    });

    // Notification pour l'utilisateur signale avec le motif.
    await createNotification({
      recipient: reportedUserId,
      sender: req.user._id,
      type: 'report',
      content: `a signale votre profil. Motif: ${cleanReason}${cleanDescription ? ` - ${cleanDescription}` : ''}`
    });

    // Notification pour les admins/root avec motif du signalement.
    const admins = await User.find({ role: { $in: ['admin', 'root'] } }).select('_id').lean();
    for (const admin of admins) {
      if (admin._id.toString() === req.user._id.toString()) continue;
      await createNotification({
        recipient: admin._id,
        sender: req.user._id,
        type: 'report',
        content: `Nouveau signalement (${cleanReason}) sur ${reportedUser.firstName || ''} ${reportedUser.lastName || ''}.`
      });
    }

    return res.status(201).json({
      message: 'Signalement enregistre et transmis a notre equipe.',
      report
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
