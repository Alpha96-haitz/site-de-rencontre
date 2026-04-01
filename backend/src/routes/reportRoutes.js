/**
 * Routes signalement
 */
import { Router } from 'express';
import * as reportController from '../controllers/reportController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);
router.post('/', reportController.createReport);

export default router;
