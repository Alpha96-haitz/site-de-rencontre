import express from 'express';
import { 
  getMessages, 
  getConversations, 
  markAsRead, 
  getOrCreateConversation, 
  getTotalUnreadMessagesCount,
  deleteConversation 
} from '../controllers/messageController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/unread-count', getTotalUnreadMessagesCount);
router.get('/conversations', getConversations);
router.get('/user/:userId', getOrCreateConversation);
router.get('/:matchId', getMessages);
router.delete('/:matchId', deleteConversation);
router.put('/:matchId/read', markAsRead);

export default router;
