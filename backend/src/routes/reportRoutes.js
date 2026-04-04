/**
 * Routes signalement
 */
import { Router } from 'express';
import * as reportController from '../controllers/reportController.js';
import { protect } from '../middleware/auth.js';
import { reportValidation, handleValidation } from '../middleware/validation.js';

const router = Router();

router.use(protect);
router.post('/', reportValidation, handleValidation, reportController.createReport);

export default router;
