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

// Compteur non lus leger pour la navbar
export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user._id,
      read: false
    });
    res.json({ count });
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
    if (!req.user?._id) return res.status(401).json({ message: "Non autorisé" });
    
    const result = await Notification.updateMany(
      { recipient: req.user._id, read: false }, 
      { read: true }
    );
    
    res.json({ 
      message: 'Toutes les notifications marquées comme lues',
      modifiedCount: result.modifiedCount 
    });
  } catch (err) {
    console.error("Error in markAllAsRead:", err);
    res.status(500).json({ message: err.message });
  }
};

// Utilitaire pour créer une notification (utilisé en interne)
export const createNotification = async ({ recipient, sender, type, post, content }) => {
  if (recipient.toString() === sender.toString()) return null;
  
  // Générer un contenu par défaut si absent (Style Facebook)
  let finalContent = content;
  if (!finalContent) {
    if (type === 'like') finalContent = "a aimé l'une de vos publications.";
    if (type === 'comment') finalContent = "a ajouté un commentaire sur votre publication.";
    if (type === 'follow') finalContent = "a commencé à suivre votre profil.";
    if (type === 'match') finalContent = "Félicitations ! Vous avez un nouveau match. Envoyez-lui un message !";
  }

  try {
    return await Notification.create({ 
      recipient, 
      sender, 
      type, 
      post, 
      content: finalContent 
    });
  } catch (err) {
    console.error('Erreur création notification:', err);
    return null;
  }
};
