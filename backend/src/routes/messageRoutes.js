import express from 'express';
import { 
  getMessages, 
  getConversations, 
  markAsRead, 
  getOrCreateConversation, 
  getTotalUnreadMessagesCount,
  deleteConversation,
  sendMessage,
  editMessage,
  deleteMessage
} from '../controllers/messageController.js';
import { protect } from '../middleware/auth.js';
import { idValidation, handleValidation } from '../middleware/validation.js';

const router = express.Router();

router.use(protect);

router.get('/unread-count', getTotalUnreadMessagesCount);
router.get('/conversations', getConversations);
router.get('/user/:userId', idValidation('userId'), handleValidation, getOrCreateConversation);
router.post('/:matchId', idValidation('matchId'), handleValidation, sendMessage);
router.get('/:matchId', idValidation('matchId'), handleValidation, getMessages);
router.delete('/:matchId', idValidation('matchId'), handleValidation, deleteConversation);
router.put('/:matchId/read', idValidation('matchId'), handleValidation, markAsRead);
router.put('/msg/:messageId', idValidation('messageId'), handleValidation, editMessage);
router.delete('/msg/:messageId', idValidation('messageId'), handleValidation, deleteMessage);

export default router;
