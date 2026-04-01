import express from 'express';
import { getMessages, getConversations, markAsRead } from '../controllers/messageController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/conversations', getConversations);
router.get('/:matchId', getMessages);
router.put('/:matchId/read', markAsRead);

export default router;
