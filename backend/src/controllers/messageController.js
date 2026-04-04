import mongoose from 'mongoose';
import Message from '../models/Message.js';
import Match from '../models/Match.js';

// Récupérer l'historique d'une conversation (Match)
export const getMessages = async (req, res) => {
  try {
    const { matchId } = req.params;
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const skip = (page - 1) * limit;
    if (!mongoose.Types.ObjectId.isValid(matchId)) {
      return res.status(400).json({ message: 'Match ID invalide' });
    }

    // Vérifier que l'utilisateur fait partie du match ET que c'est mutuel
    const match = await Match.findById(matchId);
    if (!match || !match.users.includes(req.user._id)) {
      return res.status(403).json({ message: "Accès refusé" });
    }

    if (!match.isMutual) {
      return res.status(403).json({ message: "Le chat est activé uniquement après un Match mutuel." });
    }

    const messages = await Message.find({ match: matchId })
      .populate('sender', 'firstName lastName photos googlePhoto')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    res.json(messages.reverse());
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
    .sort({ updatedAt: -1 }); // Trié par activité récente

    // Ajouter le nombre de messages non lus par match
    const matchIds = matches.map((m) => m._id);

    const [unreadAgg, lastAgg] = await Promise.all([
      Message.aggregate([
        {
          $match: {
            match: { $in: matchIds },
            sender: { $ne: req.user._id },
            'readBy.user': { $ne: req.user._id }
          }
        },
        { $group: { _id: '$match', count: { $sum: 1 } } }
      ]),
      Message.aggregate([
        { $match: { match: { $in: matchIds } } },
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: '$match',
            lastMessage: {
              $first: {
                content: '$content',
                sender: '$sender',
                createdAt: '$createdAt',
                image: '$image'
              }
            }
          }
        }
      ])
    ]);

    const unreadMap = new Map(unreadAgg.map((r) => [r._id.toString(), r.count]));
    const lastMap = new Map(lastAgg.map((r) => [r._id.toString(), r.lastMessage]));

    const conversations = matches.map((match) => {
      const unreadCount = unreadMap.get(match._id.toString()) || 0;
      const lastMessage = lastMap.get(match._id.toString()) || null;

      return {
        ...match.toObject(),
        unreadCount,
        lastMessage: lastMessage
          ? {
              content: lastMessage.content || '',
              sender: lastMessage.sender?.toString?.() || null,
              createdAt: lastMessage.createdAt,
              hasImage: Boolean(lastMessage.image?.url)
            }
          : null
      };
    });
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Récupérer le nombre total de messages non lus (tous matchs confondus)
export const getTotalUnreadMessagesCount = async (req, res) => {
  try {
    const userMatchIds = (await Match.find({ users: req.user._id }).select('_id').lean()).map((m) => m._id);
    const unreadCount = await Message.countDocuments({
      sender: { $ne: req.user._id },
      'readBy.user': { $ne: req.user._id },
      match: { $in: userMatchIds }
    });
    res.json({ count: unreadCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Marquer les messages comme lus
export const markAsRead = async (req, res) => {
  try {
    const { matchId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(matchId)) {
      return res.status(400).json({ message: 'Match ID invalide' });
    }

    const match = await Match.findById(matchId);
    if (!match || !match.users.includes(req.user._id)) {
      return res.status(403).json({ message: 'Action non autorisée' });
    }

    await Message.updateMany(
      { match: matchId, sender: { $ne: req.user._id }, 'readBy.user': { $ne: req.user._id } },
      { $push: { readBy: { user: req.user._id, readAt: Date.now() } } }
    );
    res.json({ message: "Messages marqués comme lus" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Récupérer ou créer une conversation (par userId cible)
export const getOrCreateConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUser = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "ID utilisateur invalide" });
    }

    if (userId === currentUser.toString()) {
      return res.status(400).json({ message: "Action impossible" });
    }

    // Chercher s'il existe déjà une conversation (Match) entre eux
    let conversation = await Match.findOne({
      $or: [
        { users: { $all: [currentUser, userId] } },
        { likedBy: currentUser, likedUser: userId },
        { likedBy: userId, likedUser: currentUser }
      ]
    }).populate('users', 'firstName lastName username photos googlePhoto isOnline');

    // Si on a trouvé une relation mais que 'users' n'est pas rempli (cas d'un like non mutuel)
    // On met à jour pour permettre la messagerie
    if (conversation && (!conversation.users || conversation.users.length < 2)) {
      conversation.users = [conversation.likedBy, conversation.likedUser];
      await conversation.save();
      await conversation.populate('users', 'firstName lastName username photos googlePhoto isOnline');
    }

    // Sinon, on crée une conversation (Match)
    if (!conversation) {
      try {
        conversation = await Match.create({
          users: [currentUser, userId],
          likedBy: currentUser,
          likedUser: userId,
          isMutual: false
        });
        await conversation.populate('users', 'firstName lastName username photos googlePhoto isOnline');
      } catch (createError) {
        // En cas de conflit d'index unique si un match inverse existe
        conversation = await Match.findOne({
          users: { $all: [currentUser, userId] }
        }).populate('users', 'firstName lastName username photos googlePhoto isOnline');
        if (!conversation) throw createError;
      }
    }

    if (!conversation?.isMutual) {
      return res.status(403).json({ 
        message: "Match mutuel requis pour discuter.", 
        isLocked: true 
      });
    }

    res.json(conversation);
  } catch (err) {
    console.error("Error in getOrCreateConversation:", err);
    res.status(500).json({ message: err.message });
  }
};

// Supprimer une conversation
export const deleteConversation = async (req, res) => {
  try {
    const { matchId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(matchId)) {
      return res.status(400).json({ message: 'Match ID invalide' });
    }
    
    // Vérifier que le match existe et que l'utilisateur en fait partie
    const match = await Match.findById(matchId);
    if (!match) return res.status(404).json({ message: "Conversation introuvable" });
    
    if (!match.users.includes(req.user._id.toString())) {
      return res.status(403).json({ message: "Action non autorisée" });
    }

    // Supprimer tous les messages du match
    await Message.deleteMany({ match: matchId });
    
    // Supprimer le match lui-même (ou on pourrait simplement vider les messages ?)
    // Supprimer le match lui-même est plus radical (supprime la relation)
    await Match.findByIdAndDelete(matchId);

    res.json({ message: "Conversation supprimée avec succès" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
