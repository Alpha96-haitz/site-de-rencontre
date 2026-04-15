import Notification from '../models/Notification.js';
import { notifyNotificationUnread } from '../socket/index.js';

const emitUnreadNotificationCount = async (req, recipientId) => {
  const io = req.app?.get?.('io');
  if (!io) return;
  const count = await Notification.countDocuments({ recipient: recipientId, read: false }).catch(() => 0);
  io.to(recipientId.toString()).emit('notification:unread-update', { count });
};

export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate('sender', 'firstName lastName username photos googlePhoto profilePicture')
      .populate('post', 'desc image images')
      .populate('match')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    return res.json(notifications);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user._id,
      read: false
    });
    return res.json({ count });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification introuvable' });
    }

    const count = await Notification.countDocuments({ recipient: req.user._id, read: false });
    await emitUnreadNotificationCount(req, req.user._id);
    return res.json({ message: 'Notification marquee comme lue', count });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    if (!req.user?._id) return res.status(401).json({ message: 'Non autorise' });

    const result = await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { read: true }
    );

    await emitUnreadNotificationCount(req, req.user._id);
    return res.json({
      message: 'Toutes les notifications marquees comme lues',
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const createNotification = async ({ recipient, sender, type, post, match, content }) => {
  if (recipient.toString() === sender.toString()) return null;

  let finalContent = content;
  if (!finalContent) {
    if (type === 'like') finalContent = "a aime l'une de vos publications.";
    if (type === 'comment') finalContent = 'a ajoute un commentaire sur votre publication.';
    if (type === 'follow') finalContent = 'a commence a suivre votre profil.';
    if (type === 'match') finalContent = 'Felicitations ! Vous avez un nouveau match. Envoyez-lui un message !';
    if (type === 'message') finalContent = 'vous a envoye un message.';
    if (type === 'report') finalContent = 'a envoye un signalement concernant votre profil.';
  }

  try {
    const notification = await Notification.create({
      recipient,
      sender,
      type,
      post,
      match,
      content: finalContent
    });

    // Emission temps reel pour un rendu "Instagram-like".
    try {
      const io = global?.ioInstance || null;
      if (io) {
        io.to(recipient.toString()).emit('notification:new', {
          ...notification.toObject(),
          sender: typeof sender === 'object' ? sender : { _id: sender }
        });
        await notifyNotificationUnread(io, recipient);
      }
    } catch (_) {
      // silent fail: la notif reste sauvegardee en base
    }

    return notification;
  } catch (err) {
    return null;
  }
};
