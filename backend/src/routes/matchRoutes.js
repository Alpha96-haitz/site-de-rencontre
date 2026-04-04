/**
 * Routes matching
 */
import { Router } from 'express';
import * as matchController from '../controllers/matchController.js';
import { protect } from '../middleware/auth.js';
import { idValidation, handleValidation } from '../middleware/validation.js';

const router = Router();

router.use(protect);

router.post('/like/:userId', idValidation('userId'), handleValidation, matchController.like);
router.post('/dislike/:userId', idValidation('userId'), handleValidation, matchController.dislike);
router.get('/', matchController.getMatches);
router.get('/likes-received', matchController.getLikesReceived);
router.get('/status/:userId', idValidation('userId'), handleValidation, matchController.getMatchStatus);
router.get('/:matchId', idValidation('matchId'), handleValidation, matchController.getMatchById);

export default router;
