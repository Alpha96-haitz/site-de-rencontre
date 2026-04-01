/**
 * Contrôleur Matching - Like, Dislike, Matches
 */
import Match from '../models/Match.js';
import User from '../models/User.js';
import { notifyMatch, notifyLike } from '../socket/index.js';

export const like = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUser = req.user._id;
    
    if (userId === currentUser.toString()) {
      return res.status(400).json({ message: 'Action impossible' });
    }
    
    const targetUser = await User.findById(userId);
    if (!targetUser || targetUser.isBanned) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }
    
    const existing = await Match.findOne({ likedBy: currentUser, likedUser: userId });
    if (existing) {
      return res.status(400).json({ message: 'Déjà liké' });
    }
    
    const reverseLike = await Match.findOne({ likedBy: userId, likedUser: currentUser });
    let isMutual = false;
    let matchedAt = null;
    
    if (reverseLike) {
      isMutual = true;
      matchedAt = new Date();
      await Match.findByIdAndUpdate(reverseLike._id, { isMutual: true, matchedAt, users: [currentUser, userId] });
    }
    
    const match = await Match.create({
      likedBy: currentUser,
      likedUser: userId,
      isMutual,
      matchedAt,
      users: isMutual ? [currentUser, userId] : undefined
    });

    const io = req.app.get('io');
    if (io) notifyLike(io, userId, { from: req.user, match });
    if (isMutual && io) {
      const populated = await Match.findById(match._id).populate('users', 'firstName lastName photos googlePhoto');
      notifyMatch(io, userId, populated);
      notifyMatch(io, currentUser, populated);
    }

    res.status(201).json({ match, isMutual });
  } catch (err) {
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
