/**
 * Routes admin
 */
import { Router } from 'express';
import * as adminController from '../controllers/adminController.js';
import { protect, adminOnly, rootOnly } from '../middleware/auth.js';

const router = Router();

router.use(protect, adminOnly);

router.get('/stats', adminController.getStats);
router.get('/users', adminController.getUsers);
router.get('/reports', adminController.getReports);

router.put('/users/:userId/ban', adminController.banUser);
router.put('/users/:userId/unban', adminController.unbanUser);
router.put('/reports/:reportId', adminController.handleReport);
router.post('/reports/:reportId/notify', adminController.sendNotificationToReportedUser);

// Backward compatibility endpoints
router.post('/ban/:userId', adminController.banUser);
router.post('/unban/:userId', adminController.unbanUser);
router.post('/reports/:reportId/handle', adminController.handleReport);

// Root-only destructive actions
router.delete('/users/:userId', rootOnly, adminController.deleteUser);
router.delete('/posts/:postId', rootOnly, adminController.deleteAnyPost);

export default router;
