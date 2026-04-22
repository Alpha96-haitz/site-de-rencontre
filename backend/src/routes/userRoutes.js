/**
 * Routes utilisateur
 */
import { Router } from 'express';
import * as userController from '../controllers/userController.js';
import { changePassword } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { profileValidation, changePasswordValidation, handleValidation } from '../middleware/validation.js';

const router = Router();

router.use(protect);

router.get('/search', userController.search);
router.get('/suggestions', userController.getSuggestions);
router.get('/:id', userController.getProfile);
router.put('/profile', profileValidation, handleValidation, userController.updateProfile);
router.post('/photos', upload.single('photo'), userController.uploadPhoto);
router.post('/cover', upload.single('photo'), userController.uploadCover);
router.put('/photos/:publicId/primary', userController.setPrimaryPhoto);
router.put('/photos/*/primary', userController.setPrimaryPhoto);
router.put(/^\/photos\/(.+)\/primary$/, userController.setPrimaryPhoto);
router.delete('/photos/:publicId', userController.deletePhoto);
router.delete('/photos/*', userController.deletePhoto);
router.delete(/^\/photos\/(.+)$/, userController.deletePhoto);

router.put('/:id/follow', userController.followUser);
router.put('/:id/unfollow', userController.unfollowUser);

router.delete('/delete-account', userController.deleteAccount);

// Change Password
router.put('/change-password', changePasswordValidation, handleValidation, changePassword);

export default router;
