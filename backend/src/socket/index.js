/**
 * Socket.io - Messagerie temps réel et notifications
 */
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Message from '../models/Message.js';

const onlineUsers = new Map();

export const initSocket = (io) => {
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
    if (!token) return next(new Error('Non authentifié'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('_id firstName lastName');
      if (!user) return next(new Error('Utilisateur introuvable'));
      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (e) {
      next(new Error('Token invalide'));
    }
  });

  io.on('connection', (socket) => {
    onlineUsers.set(socket.userId, socket.id);
    socket.broadcast.emit('user:online', { userId: socket.userId });

    socket.on('join:match', (matchId) => {
      socket.join(`match:${matchId}`);
    });

    socket.on('leave:match', (matchId) => {
      socket.leave(`match:${matchId}`);
    });

    socket.on('message:send', async (data) => {
      const { matchId, content, image } = data;
      if (!matchId) return;
      try {
        const message = await Message.create({
          match: matchId,
          sender: socket.userId,
          content: content || '',
          image
        });
        await message.populate('sender', 'firstName lastName photos');
        io.to(`match:${matchId}`).emit('message:new', message);
      } catch (err) {
        socket.emit('message:error', { message: err.message });
      }
    });

    socket.on('message:read', (matchId) => {
      socket.to(`match:${matchId}`).emit('message:read', { userId: socket.userId, matchId });
    });

    socket.on('disconnect', () => {
      onlineUsers.delete(socket.userId);
      socket.broadcast.emit('user:offline', { userId: socket.userId });
    });
  });

  return io;
};

export const notifyMatch = (io, userId, matchData) => {
  const socketId = onlineUsers.get(userId?.toString());
  if (socketId) io.to(socketId).emit('match:new', matchData);
};

export const notifyLike = (io, userId, likeData) => {
  const socketId = onlineUsers.get(userId?.toString());
  if (socketId) io.to(socketId).emit('like:received', likeData);
};
