import Notification from '../models/Notification.js';

// Récupérer les notifications de l'utilisateur
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate('sender', 'firstName lastName username photos googlePhoto')
      .populate('post', 'desc image')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Marquer une notification comme lue
export const markAsRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ message: 'Notification marquée comme lue' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Marquer toutes les notifications comme lues
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user._id }, { read: true });
    res.json({ message: 'Toutes les notifications marquées comme lues' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Utilitaire pour créer une notification (utilisé en interne)
export const createNotification = async ({ recipient, sender, type, post, content }) => {
  if (recipient.toString() === sender.toString()) return null;
  try {
    return await Notification.create({ recipient, sender, type, post, content });
  } catch (err) {
    console.error('Erreur création notification:', err);
    return null;
  }
};
