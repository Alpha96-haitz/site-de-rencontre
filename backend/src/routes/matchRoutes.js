/**
 * Routes matching
 */
import { Router } from 'express';
import * as matchController from '../controllers/matchController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.post('/like/:userId', matchController.like);
router.post('/dislike/:userId', matchController.dislike);
router.get('/', matchController.getMatches);
router.get('/likes-received', matchController.getLikesReceived);

export default router;
