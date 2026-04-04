/**
 * Middleware d'authentification JWT
 */
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  try {
    let token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Non authentifie' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'Utilisateur introuvable' });
    }
    if (user.isBanned) {
      return res.status(403).json({ message: 'Compte desactive' });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token invalide ou expire' });
  }
};

export const adminOnly = (req, res, next) => {
  if (!['admin', 'root'].includes(req.user?.role)) {
    return res.status(403).json({ message: 'Acces reserve aux administrateurs' });
  }
  next();
};

export const rootOnly = (req, res, next) => {
  if (req.user?.role !== 'root') {
    return res.status(403).json({ message: 'Acces reserve au super administrateur' });
  }
  next();
};
