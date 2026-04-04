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
import { idValidation, handleValidation } from '../middleware/validation.js';

const router = express.Router();

router.use(protect);

router.get('/unread-count', getTotalUnreadMessagesCount);
router.get('/conversations', getConversations);
router.get('/user/:userId', idValidation('userId'), handleValidation, getOrCreateConversation);
router.get('/:matchId', idValidation('matchId'), handleValidation, getMessages);
router.delete('/:matchId', idValidation('matchId'), handleValidation, deleteConversation);
router.put('/:matchId/read', idValidation('matchId'), handleValidation, markAsRead);

export default router;
