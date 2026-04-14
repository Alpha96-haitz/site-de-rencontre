/**
 * Controleur Admin - Gestion et statistiques
 */
import User from '../models/User.js';
import Match from '../models/Match.js';
import Report from '../models/Report.js';
import Message from '../models/Message.js';
import Post from '../models/Post.js';
import Notification from '../models/Notification.js';

export const getStats = async (req, res) => {
  try {
    const [users, online, matches, reports, messages, posts] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isOnline: true }),
      Match.countDocuments({ isMutual: true }),
      Report.countDocuments({ status: 'pending' }),
      Message.countDocuments(),
      Post.countDocuments()
    ]);
    res.json({ users, online, matches, reports, messages, posts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password -emailVerificationToken -passwordResetToken')
      .sort({ createdAt: -1 })
      .lean();

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const banUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { duration } = req.body || {};

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });

    if (user.role === 'root') {
      return res.status(403).json({ message: 'Impossible de bannir un compte root' });
    }

    user.isBanned = true;
    user.bannedUntil = duration ? new Date(Date.now() + Number(duration) * 24 * 60 * 60 * 1000) : null;
    await user.save();

    res.json({ message: 'Utilisateur banni' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const unbanUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });

    user.isBanned = false;
    user.bannedUntil = null;
    await user.save();

    res.json({ message: 'Utilisateur debanni' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });

    if (user.role === 'root') {
      return res.status(403).json({ message: 'Suppression d un compte root interdite' });
    }

    await Promise.all([
      User.findByIdAndDelete(userId),
      Post.deleteMany({ userId }),
      Match.deleteMany({ $or: [{ users: userId }, { likedBy: userId }, { likedUser: userId }] }),
      Report.deleteMany({ $or: [{ reporter: userId }, { reportedUser: userId }] }),
      Notification.deleteMany({ $or: [{ recipient: userId }, { sender: userId }] })
    ]);

    res.json({ message: 'Utilisateur supprime' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteAnyPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post introuvable' });

    await post.deleteOne();
    await Notification.deleteMany({ post: post._id });

    res.json({ message: 'Publication supprimee' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getReports = async (req, res) => {
  try {
    const reports = await Report.find({ status: 'pending' })
      .populate('reporter', 'firstName lastName email username')
      .populate('reportedUser', 'firstName lastName email username photos')
      .lean();

    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const handleReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { action, banUser: shouldBan } = req.body;
    const report = await Report.findById(reportId);
    if (!report) return res.status(404).json({ message: 'Report introuvable' });

    report.status = action || 'reviewed';
    report.reviewedBy = req.user._id;
    report.reviewedAt = new Date();
    await report.save();

    if (shouldBan) {
      const reportedUser = await User.findById(report.reportedUser);
      if (reportedUser && reportedUser.role !== 'root') {
        reportedUser.isBanned = true;
        reportedUser.bannedUntil = null;
        await reportedUser.save();
      }
    }

    res.json({ message: 'Report traite' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const sendNotificationToReportedUser = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: 'Le message ne peut pas être vide' });
    }

    const report = await Report.findById(reportId).populate('reportedUser');
    if (!report) return res.status(404).json({ message: 'Report introuvable' });

    // Créer une notification
    const notification = await Notification.create({
      recipient: report.reportedUser._id,
      sender: req.user._id,
      type: 'report',
      content: message
    });

    res.json({ 
      message: 'Notification envoyée à l\'utilisateur',
      notification 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
