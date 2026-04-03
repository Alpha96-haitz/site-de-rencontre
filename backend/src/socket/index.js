/**
 * Socket.io - Messagerie temps réel et notifications
 */
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Message from '../models/Message.js';
import Match from '../models/Match.js';
import { createNotification } from '../controllers/notificationController.js';

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

  io.on('connection', async (socket) => {
    onlineUsers.set(socket.userId, socket.id);
    // Mettre à jour le statut en ligne dans la base de données
    await User.findByIdAndUpdate(socket.userId, { isOnline: true, lastSeen: new Date() });
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
        const match = await Match.findById(matchId);
        if (!match || !match.isMutual) {
          return socket.emit('message:error', { message: 'Le chat est verrouillé tant qu’il n’y a pas de match mutuel.' });
        }

        const message = await Message.create({
          match: matchId,
          sender: socket.userId,
          content: content || '',
          image
        });
        await Match.findByIdAndUpdate(matchId, { updatedAt: Date.now() });
        await message.populate('sender', 'firstName lastName photos');
        
        // Gérer les notifications pour les autres membres du match
        const recipients = match.users.filter(id => id.toString() !== socket.userId);
        
        for (const recipientId of recipients) {
          // On n'envoie plus de Notification globale pour les messages privés 
          // afin d'éviter de polluer le flux d'activité social.


          // Envoyer via Socket si en ligne
          const recipientSocketId = onlineUsers.get(recipientId.toString());
          if (recipientSocketId) {
            io.to(recipientSocketId).emit('message:received', message);
            // On peut aussi envoyer le nouveau compte total de non lus
            const unreadCount = await Message.countDocuments({
              sender: { $ne: recipientId },
              'readBy.user': { $ne: recipientId },
              match: { $in: (await Match.find({ users: recipientId }).select('_id')).map(m => m._id) }
            });
            io.to(recipientSocketId).emit('message:unread-update', { count: unreadCount });
          }
        }

        io.to(`match:${matchId}`).emit('message:new', message);
      } catch (err) {
        socket.emit('message:error', { message: err.message });
      }
    });

    socket.on('message:read', (matchId) => {
      socket.to(`match:${matchId}`).emit('message:read', { userId: socket.userId, matchId });
    });

    socket.on('disconnect', async () => {
      onlineUsers.delete(socket.userId);
      await User.findByIdAndUpdate(socket.userId, { isOnline: false, lastSeen: new Date() });
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
