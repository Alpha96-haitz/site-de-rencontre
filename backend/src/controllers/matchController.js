import Match from '../models/Match.js';
import User from '../models/User.js';
import { notifyMatch, notifyLike, notifyNotificationUnread } from '../socket/index.js';
import { createNotification } from './notificationController.js';

const processLike = async (req, res, { isSuperLike = false } = {}) => {
  const { userId } = req.params;
  const currentUser = req.user._id;

  if (!userId || userId === 'undefined' || userId === currentUser.toString()) {
    return res.status(400).json({ message: 'Action impossible : ID invalide ou manquant' });
  }

  const targetExists = await User.exists({ _id: userId, isBanned: false });
  if (!targetExists) {
    return res.status(404).json({ message: 'Utilisateur introuvable' });
  }

  // If current user already liked this profile, return existing relation.
  const direct = await Match.findOne({ likedBy: currentUser, likedUser: userId });
  if (direct) {
    return res.status(200).json({ 
      match: direct, 
      isMutual: direct.isMutual,
      alreadyLiked: true,
      message: 'Vous avez deja liké cet utilisateur'
    });
  }

  // If reverse like exists, convert to a mutual match.
  const reverseLike = await Match.findOne({ likedBy: userId, likedUser: currentUser });
  let match;
  let isMutual = false;

  if (reverseLike) {
    if (reverseLike.isMutual) {
      return res.status(200).json({ match: reverseLike, isMutual: true });
    }

    isMutual = true;
    reverseLike.isMutual = true;
    reverseLike.matchedAt = new Date();
    reverseLike.users = [currentUser, userId];
    match = await reverseLike.save();

    await createNotification({
      recipient: userId,
      sender: currentUser,
      type: 'match',
      content: `C'est un match ! Vous etes maintenant connecte avec ${req.user.firstName}.`
    });

    await createNotification({
      recipient: currentUser,
      sender: userId,
      type: 'match',
      content: "C'est un match ! Vous etes maintenant connecte avec ce profil."
    });

    const io = req.app.get('io');
    if (io) {
      const populated = await Match.findById(match._id).populate('users', 'firstName lastName photos googlePhoto');
      notifyMatch(io, userId, populated);
      notifyMatch(io, currentUser, populated);
      await notifyNotificationUnread(io, userId);
      await notifyNotificationUnread(io, currentUser);
    }
  } else {
    try {
      match = await Match.create({
        users: [currentUser, userId],
        likedBy: currentUser,
        likedUser: userId,
        isMutual: false
      });
    } catch (createErr) {
      // Prevent duplicates on race conditions.
      if (createErr?.code === 11000) {
        const concurrent = await Match.findOne({
          $or: [
            { likedBy: currentUser, likedUser: userId },
            { likedBy: userId, likedUser: currentUser }
          ]
        });
        if (concurrent) {
          return res.status(200).json({ match: concurrent, isMutual: concurrent.isMutual });
        }
      }
      throw createErr;
    }

    await createNotification({
      recipient: userId,
      sender: currentUser,
      type: 'like',
      content: isSuperLike
        ? `${req.user.firstName} vous a envoye un SUPER LIKE !`
        : `${req.user.firstName} vous a envoye un like !`
    });

    const io = req.app.get('io');
    if (io) {
      notifyLike(io, userId, { from: req.user, match, isSuperLike });
      await notifyNotificationUnread(io, userId);
    }
  }

  return res.status(isMutual ? 200 : 201).json({ match, isMutual, isSuperLike });
};

export const like = async (req, res) => {
  try {
    return await processLike(req, res, { isSuperLike: false });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const superLike = async (req, res) => {
  try {
    return await processLike(req, res, { isSuperLike: true });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const dislike = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUser = req.user._id;

    await Match.findOneAndDelete({ likedBy: currentUser, likedUser: userId, isMutual: false });
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

    const formatted = matches.map((m) => {
      const other = m.users.find((u) => u._id.toString() !== req.user._id.toString());
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

export const getMatchById = async (req, res) => {
  try {
    const { matchId } = req.params;
    const match = await Match.findById(matchId).populate('users', 'firstName lastName photos googlePhoto isOnline lastSeen');

    if (!match) return res.status(404).json({ message: 'Match introuvable' });

    if (!match.users.some((u) => u._id.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Action non autorisee' });
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
