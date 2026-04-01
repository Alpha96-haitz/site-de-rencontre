/**
 * Contrôleur Admin - Gestion et statistiques
 */
import User from '../models/User.js';
import Match from '../models/Match.js';
import Report from '../models/Report.js';
import Message from '../models/Message.js';

export const getStats = async (req, res) => {
  try {
    const [users, matches, reports, messages] = await Promise.all([
      User.countDocuments(),
      Match.countDocuments({ isMutual: true }),
      Report.countDocuments({ status: 'pending' }),
      Message.countDocuments()
    ]);
    res.json({ users, matches, reports, messages });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const banUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason, duration } = req.body; // duration en jours, ou permanent
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
    
    user.isBanned = true;
    user.bannedUntil = duration ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000) : null;
    await user.save();
    res.json({ message: 'Utilisateur banni' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const unbanUser = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.userId, { isBanned: false, bannedUntil: null });
    res.json({ message: 'Utilisateur débanni' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getReports = async (req, res) => {
  try {
    const reports = await Report.find({ status: 'pending' })
      .populate('reporter', 'firstName lastName email')
      .populate('reportedUser', 'firstName lastName email photos');
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const handleReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { action, banUser } = req.body; // action: 'dismissed' | 'action_taken'
    const report = await Report.findById(reportId);
    if (!report) return res.status(404).json({ message: 'Report introuvable' });
    
    report.status = action || 'reviewed';
    report.reviewedBy = req.user._id;
    report.reviewedAt = new Date();
    await report.save();
    
    if (banUser) {
      await User.findByIdAndUpdate(report.reportedUser, { isBanned: true });
    }
    res.json({ message: 'Report traité' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
