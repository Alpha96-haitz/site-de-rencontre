import Message from '../models/Message.js';
import Match from '../models/Match.js';

// Récupérer l'historique d'une conversation (Match)
export const getMessages = async (req, res) => {
  try {
    const { matchId } = req.params;
    
    // Vérifier que l'utilisateur fait partie du match
    const match = await Match.findById(matchId);
    if (!match || !match.users.includes(req.user._id)) {
      return res.status(403).json({ message: "Accès refusé" });
    }

    const messages = await Message.find({ match: matchId })
      .populate('sender', 'firstName lastName photos googlePhoto')
      .sort({ createdAt: 1 });
    
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Récupérer la liste des conversations (Matchs mutuels)
export const getConversations = async (req, res) => {
  try {
    const matches = await Match.find({ 
      users: req.user._id,
      isMutual: true 
    })
    .populate('users', 'firstName lastName username photos googlePhoto isOnline')
    .sort({ matchedAt: -1 });

    // On pourrait ajouter le dernier message ici si on voulait optimiser
    res.json(matches);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Marquer les messages comme lus
export const markAsRead = async (req, res) => {
  try {
    const { matchId } = req.params;
    await Message.updateMany(
      { match: matchId, sender: { $ne: req.user._id }, 'readBy.user': { $ne: req.user._id } },
      { $push: { readBy: { user: req.user._id, readAt: Date.now() } } }
    );
    res.json({ message: "Messages marqués comme lus" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
