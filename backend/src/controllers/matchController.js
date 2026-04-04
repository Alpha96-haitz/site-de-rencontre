import Match from '../models/Match.js';
import User from '../models/User.js';
import { notifyMatch, notifyLike } from '../socket/index.js';
import { createNotification } from './notificationController.js';

export const like = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUser = req.user._id;
    
    // Debug: log action
    console.log(`Action Like: de ${currentUser} vers ${userId}`);

    if (!userId || userId === "undefined" || userId === currentUser.toString()) {
      return res.status(400).json({ message: 'Action impossible : ID invalide ou manquant' });
    }
    
    // 1. Chercher si j'ai déjà liké ou s'il y a déjà un match
    const existing = await Match.findOne({
      $or: [
        { likedBy: currentUser, likedUser: userId },
        { users: { $all: [currentUser, userId] } }
      ]
    });

    if (existing) {
      console.log("Interaction existante, retour avec 200 OK");
      return res.status(200).json({ match: existing, isMutual: existing.isMutual });
    }

    // 2. Chercher s'il y a un like en sens inverse
    const reverseLike = await Match.findOne({ likedBy: userId, likedUser: currentUser });
    let match;
    let isMutual = false;

    if (reverseLike) {
      // C'est un match ! On transforme le reverseLike en Match mutuel
      isMutual = true;
      reverseLike.isMutual = true;
      reverseLike.matchedAt = new Date();
      reverseLike.users = [currentUser, userId];
      match = await reverseLike.save();

      // Notifications de Match pour les deux
      await createNotification({
        recipient: userId,
        sender: currentUser,
        type: 'match',
        content: `C'est un match ! Vous êtes maintenant connecté avec ${req.user.firstName}.`
      });

      await createNotification({
        recipient: currentUser,
        sender: userId,
        type: 'match',
        content: `C'est un match ! Vous êtes maintenant connecté avec le profil.`
      });

      const io = req.app.get('io');
      if (io) {
        const populated = await Match.findById(match._id).populate('users', 'firstName lastName photos googlePhoto');
        notifyMatch(io, userId, populated);
        notifyMatch(io, currentUser, populated);
      }
    } else {
      // Pas encore de match, on crée le like
      match = await Match.create({
        users: [currentUser, userId],
        likedBy: currentUser,
        likedUser: userId,
        isMutual: false
      });

      // Notification de simple like (optionnel, mais demandé pour "reçois une notification")
      await createNotification({
        recipient: userId,
        sender: currentUser,
        type: 'like',
        content: `${req.user.firstName} vous a envoyé un like !`
      });

      const io = req.app.get('io');
      if (io) notifyLike(io, userId, { from: req.user, match });
    }

    res.status(201).json({ match, isMutual });
  } catch (err) {
    console.error("Error in like:", err);
    res.status(500).json({ message: err.message });
  }
};

export const dislike = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUser = req.user._id;
    
    await Match.findOneAndDelete({ likedBy: currentUser, likedUser: userId });
    res.json({ message: 'OK' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getMatches = async (req, res) => {
  try {
    const matches = await Match.find({
      users: req.user._id,
      isMutual: true
    })
      .populate('users', 'firstName lastName photos googlePhoto lastSeen isOnline')
      .sort({ matchedAt: -1 });
    
    const formatted = matches.map(m => {
      const other = m.users.find(u => u._id.toString() !== req.user._id.toString());
      return { ...m.toObject(), matchedUser: other };
    });
    
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getLikesReceived = async (req, res) => {
  try {
    const likes = await Match.find({
      likedUser: req.user._id,
      isMutual: false
    }).populate('likedBy', 'firstName lastName photos googlePhoto');
    res.json(likes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Récupérer un match par ID
export const getMatchById = async (req, res) => {
  try {
    const { matchId } = req.params;
    const match = await Match.findById(matchId).populate('users', 'firstName lastName photos googlePhoto isOnline lastSeen');
    
    if (!match) return res.status(404).json({ message: "Match introuvable" });
    
    if (!match.users.some(u => u._id.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: "Action non autorisée" });
    }

    res.json(match);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getMatchStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUser = req.user._id;

    const match = await Match.findOne({
      $or: [
        { likedBy: currentUser, likedUser: userId },
        { likedBy: userId, likedUser: currentUser }
      ]
    });

    res.json({
      isMutual: match?.isMutual || false,
      hasLiked: !!match && match.likedBy?.toString() === currentUser.toString(),
      matchId: match?.isMutual ? match._id : null
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
