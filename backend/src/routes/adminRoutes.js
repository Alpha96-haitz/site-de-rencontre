/**
 * Routes admin
 */
import { Router } from 'express';
import * as adminController from '../controllers/adminController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = Router();

router.use(protect, adminOnly);

router.get('/stats', adminController.getStats);
router.post('/ban/:userId', adminController.banUser);
router.post('/unban/:userId', adminController.unbanUser);
router.get('/reports', adminController.getReports);
router.post('/reports/:reportId/handle', adminController.handleReport);

export default router;
