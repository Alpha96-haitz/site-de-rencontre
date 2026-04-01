/**
 * Routes utilisateur
 */
import { Router } from 'express';
import * as userController from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.use(protect);

router.get('/search', userController.search);
router.get('/suggestions', userController.getSuggestions);
router.get('/:id', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.post('/photos', upload.single('photo'), userController.uploadPhoto);
router.delete('/photos/:publicId', userController.deletePhoto);

// Follow / Unfollow
router.put('/:id/follow', userController.followUser);
router.put('/:id/unfollow', userController.unfollowUser);

export default router;
