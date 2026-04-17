import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Message from '../models/Message.js';
import Match from '../models/Match.js';
import Notification from '../models/Notification.js';

// userId -> Set(socketId)
const onlineUsers = new Map();

const addSocketForUser = (userId, socketId) => {
  const set = onlineUsers.get(userId) || new Set();
  set.add(socketId);
  onlineUsers.set(userId, set);
};

const removeSocketForUser = (userId, socketId) => {
  const set = onlineUsers.get(userId);
  if (!set) return;
  set.delete(socketId);
  if (set.size === 0) onlineUsers.delete(userId);
};

const getUserSocketIds = (userId) => Array.from(onlineUsers.get(userId?.toString()) || []);

const emitNotificationUnreadCount = async (io, userId) => {
  const ids = getUserSocketIds(userId);
  if (!ids.length) return;
  const count = await Notification.countDocuments({ recipient: userId, read: false }).catch(() => 0);
  for (const sid of ids) io.to(sid).emit('notification:unread-update', { count });
};

export const initSocket = (io) => {
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
    if (!token) return next(new Error('Non authentifie'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('_id firstName lastName');
      if (!user) return next(new Error('Utilisateur introuvable'));
      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch {
      next(new Error('Token invalide'));
    }
  });

  io.on('connection', async (socket) => {
    socket.joinedMatches = new Set();
    socket.join(socket.userId);
    addSocketForUser(socket.userId, socket.id);

    await User.findByIdAndUpdate(socket.userId, { isOnline: true, lastSeen: new Date() }).catch(() => {});
    socket.broadcast.emit('user:online', { userId: socket.userId });
    await emitNotificationUnreadCount(io, socket.userId);

    socket.on('join:match', async (matchId) => {
      if (!matchId) return;
      try {
        const match = await Match.findById(matchId).select('users isMutual').lean();
        const isParticipant = Boolean(match?.users?.some((id) => id.toString() === socket.userId));
        if (!match || !isParticipant || !match.isMutual) return;
        socket.join(`match:${matchId}`);
        socket.joinedMatches.add(String(matchId));
      } catch (_) {}
    });

    socket.on('leave:match', (matchId) => {
      socket.leave(`match:${matchId}`);
      if (socket.joinedMatches) socket.joinedMatches.delete(String(matchId));
    });

    socket.on('message:send', async (data) => {
      const { matchId, content, image, clientTempId } = data || {};
      if (!matchId) return;

      try {
        const match = await Match.findById(matchId).lean();
        const isParticipant = Boolean(
          match?.users?.some((id) => id.toString() === socket.userId)
        );
        if (!match || !isParticipant) {
          return socket.emit('message:error', {
            message: 'Action non autorisee.',
            clientTempId: clientTempId || null
          });
        }
        if (!match.isMutual) {
          return socket.emit('message:error', {
            message: 'Le chat est verrouille tant qu il n y a pas de match mutuel.',
            clientTempId: clientTempId || null
          });
        }
        if (!String(content || '').trim() && !image?.url) {
          return socket.emit('message:error', {
            message: 'Message vide.',
            clientTempId: clientTempId || null
          });
        }

        const message = await Message.create({
          match: matchId,
          sender: socket.userId,
          content: String(content || '').trim(),
          image
        });

        await Match.findByIdAndUpdate(matchId, { updatedAt: Date.now() }).catch(() => {});
        await message.populate('sender', 'firstName lastName photos');

        const payload = {
          ...message.toObject(),
          match: String(matchId),
          sender: {
            ...message.sender.toObject(),
            _id: String(message.sender._id)
          },
          clientTempId: clientTempId || null
        };

        const recipients = (match.users || []).map((id) => id.toString()).filter((id) => id !== socket.userId);

        for (const recipientId of recipients) {
          const recipientSocketIds = getUserSocketIds(recipientId);
          for (const sid of recipientSocketIds) {
            io.to(sid).emit('message:received', payload);
            // Delta unread +1: evite un countDocuments couteux a chaque message.
            io.to(sid).emit('message:unread-update', { delta: 1, matchId });
          }
        }

        io.to(`match:${matchId}`).emit('message:new', payload);
      } catch (err) {
        socket.emit('message:error', {
          message: err.message,
          clientTempId: clientTempId || null
        });
      }
    });

    socket.on('message:read', (matchId) => {
      socket.to(`match:${matchId}`).emit('message:read', { userId: socket.userId, matchId });
    });

    socket.on('typing:start', ({ matchId } = {}) => {
      if (!matchId) return;
      if (!socket.joinedMatches?.has(String(matchId))) return;
      socket.to(`match:${matchId}`).emit('typing:start', { matchId, userId: socket.userId });
    });

    socket.on('typing:stop', ({ matchId } = {}) => {
      if (!matchId) return;
      if (!socket.joinedMatches?.has(String(matchId))) return;
      socket.to(`match:${matchId}`).emit('typing:stop', { matchId, userId: socket.userId });
    });

    socket.on('disconnect', async () => {
      removeSocketForUser(socket.userId, socket.id);
      if (!onlineUsers.has(socket.userId)) {
        await User.findByIdAndUpdate(socket.userId, { isOnline: false, lastSeen: new Date() }).catch(() => {});
        socket.broadcast.emit('user:offline', { userId: socket.userId });
      }
    });
  });

  return io;
};

export const notifyMatch = (io, userId, matchData) => {
  const ids = getUserSocketIds(userId);
  for (const sid of ids) io.to(sid).emit('match:new', matchData);
};

export const notifyLike = (io, userId, likeData) => {
  const ids = getUserSocketIds(userId);
  for (const sid of ids) io.to(sid).emit('like:received', likeData);
};

export const notifyNotificationUnread = async (io, userId) => {
  await emitNotificationUnreadCount(io, userId);
};

export const notifyNewPost = (io, postData) => {
  if (!io) return;
  io.emit('post:new', postData);
};

export const notifyPostLike = (io, postId, likes, userId) => {
  if (!io) return;
  io.emit('post:like-updated', { postId, likes, userId });
};

export const notifyPostComment = (io, postId, comment) => {
  if (!io) return;
  io.emit('post:comment-added', { postId, comment });
};

export const notifyUserStats = (io, userId, stats) => {
  if (!io) return;
  io.emit('user:stats-updated', { userId, ...stats });
};

export const notifyUserDeleted = (io, userId) => {
  if (!io) return;
  io.emit('user:deleted', { userId });
};
