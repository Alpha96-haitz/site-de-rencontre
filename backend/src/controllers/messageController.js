import mongoose from 'mongoose';
import Message from '../models/Message.js';
import Match from '../models/Match.js';

const isUserInMatch = (match, userId) =>
  Boolean(match?.users?.some((id) => id.toString() === userId.toString()));

// Recuperer l'historique d'une conversation (match)
export const getMessages = async (req, res) => {
  try {
    const { matchId } = req.params;
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const skip = (page - 1) * limit;

    if (!mongoose.Types.ObjectId.isValid(matchId)) {
      return res.status(400).json({ message: 'Match ID invalide' });
    }

    const match = await Match.findById(matchId);
    if (!match || !isUserInMatch(match, req.user._id)) {
      return res.status(403).json({ message: 'Acces refuse' });
    }
    if (!match.isMutual) {
      return res.status(403).json({ message: 'Le chat est active uniquement apres un match mutuel.' });
    }

    const messages = await Message.find({ match: matchId })
      .populate('sender', 'firstName lastName photos googlePhoto')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return res.json(messages.reverse());
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Recuperer la liste des conversations (matchs mutuels)
export const getConversations = async (req, res) => {
  try {
    const matches = await Match.find({
      users: req.user._id,
      isMutual: true
    })
      .populate('users', 'firstName lastName username photos googlePhoto isOnline')
      .sort({ updatedAt: -1 });

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

    const unreadMap = new Map(unreadAgg.map((row) => [row._id.toString(), row.count]));
    const lastMap = new Map(lastAgg.map((row) => [row._id.toString(), row.lastMessage]));

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

    return res.json(conversations);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Recuperer le nombre total de messages non lus
export const getTotalUnreadMessagesCount = async (req, res) => {
  try {
    const userMatchIds = (await Match.find({ users: req.user._id }).select('_id').lean()).map((m) => m._id);
    const unreadCount = await Message.countDocuments({
      sender: { $ne: req.user._id },
      'readBy.user': { $ne: req.user._id },
      match: { $in: userMatchIds }
    });
    return res.json({ count: unreadCount });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Marquer les messages d'un match comme lus
export const markAsRead = async (req, res) => {
  try {
    const { matchId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(matchId)) {
      return res.status(400).json({ message: 'Match ID invalide' });
    }

    const match = await Match.findById(matchId);
    if (!match || !isUserInMatch(match, req.user._id)) {
      return res.status(403).json({ message: 'Action non autorisee' });
    }

    await Message.updateMany(
      { match: matchId, sender: { $ne: req.user._id }, 'readBy.user': { $ne: req.user._id } },
      { $push: { readBy: { user: req.user._id, readAt: Date.now() } } }
    );

    const userMatchIds = (await Match.find({ users: req.user._id }).select('_id').lean()).map((m) => m._id);
    const unreadCount = await Message.countDocuments({
      sender: { $ne: req.user._id },
      'readBy.user': { $ne: req.user._id },
      match: { $in: userMatchIds }
    });

    const io = req.app.get('io');
    if (io) io.to(req.user._id.toString()).emit('message:unread-update', { count: unreadCount });

    return res.json({ message: 'Messages marques comme lus', unreadCount });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Envoyer un message via HTTP (fallback quand socket indisponible)
export const sendMessage = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { content, image, clientTempId } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(matchId)) {
      return res.status(400).json({ message: 'Match ID invalide' });
    }
    if (!String(content || '').trim() && !image?.url) {
      return res.status(400).json({ message: 'Message vide' });
    }

    const match = await Match.findById(matchId).lean();
    if (!match || !isUserInMatch(match, req.user._id)) {
      return res.status(403).json({ message: 'Action non autorisee' });
    }
    if (!match.isMutual) {
      return res.status(403).json({ message: 'Le chat est active uniquement apres un match mutuel.' });
    }

    const message = await Message.create({
      match: matchId,
      sender: req.user._id,
      content: String(content || '').trim(),
      image
    });

    await Match.findByIdAndUpdate(matchId, { updatedAt: Date.now() }).catch(() => {});
    await message.populate('sender', 'firstName lastName photos googlePhoto');

    const payload = {
      ...message.toObject(),
      clientTempId: clientTempId || null
    };

    const io = req.app.get('io');
    if (io) {
      const recipients = (match.users || [])
        .map((id) => id.toString())
        .filter((id) => id !== req.user._id.toString());

      for (const recipientId of recipients) {
        io.to(recipientId).emit('message:received', payload);
        io.to(recipientId).emit('message:unread-update', { delta: 1, matchId });
      }
      io.to(`match:${matchId}`).emit('message:new', payload);
    }

    return res.status(201).json(payload);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Recuperer ou creer une conversation (par userId cible)
export const getOrCreateConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUser = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'ID utilisateur invalide' });
    }
    if (userId === currentUser.toString()) {
      return res.status(400).json({ message: 'Action impossible' });
    }

    let conversation = await Match.findOne({
      $or: [
        { users: { $all: [currentUser, userId] } },
        { likedBy: currentUser, likedUser: userId },
        { likedBy: userId, likedUser: currentUser }
      ]
    }).populate('users', 'firstName lastName username photos googlePhoto isOnline');

    if (conversation && (!conversation.users || conversation.users.length < 2)) {
      conversation.users = [conversation.likedBy, conversation.likedUser];
      await conversation.save();
      await conversation.populate('users', 'firstName lastName username photos googlePhoto isOnline');
    }

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
        conversation = await Match.findOne({
          users: { $all: [currentUser, userId] }
        }).populate('users', 'firstName lastName username photos googlePhoto isOnline');
        if (!conversation) throw createError;
      }
    }

    if (!conversation?.isMutual) {
      return res.status(403).json({
        message: 'Match mutuel requis pour discuter.',
        isLocked: true
      });
    }

    return res.json(conversation);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Supprimer une conversation
export const deleteConversation = async (req, res) => {
  try {
    const { matchId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(matchId)) {
      return res.status(400).json({ message: 'Match ID invalide' });
    }

    const match = await Match.findById(matchId);
    if (!match) return res.status(404).json({ message: 'Conversation introuvable' });
    if (!isUserInMatch(match, req.user._id)) {
      return res.status(403).json({ message: 'Action non autorisee' });
    }

    await Message.deleteMany({ match: matchId });
    await Match.findByIdAndDelete(matchId);

    return res.json({ message: 'Conversation supprimee avec succes' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
