/**
 * Agrégation des routes
 */
import { Router } from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import matchRoutes from './matchRoutes.js';
import messageRoutes from './messageRoutes.js';
import reportRoutes from './reportRoutes.js';
import adminRoutes from './adminRoutes.js';
import postRoutes from './postRoutes.js';
import notificationRoutes from './notificationRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/matches', matchRoutes);
router.use('/messages', messageRoutes);
router.use('/reports', reportRoutes);
router.use('/admin', adminRoutes);
router.use('/posts', postRoutes);
router.use('/notifications', notificationRoutes);

router.get('/health', (req, res) => res.json({ status: 'OK' }));

export default router;
