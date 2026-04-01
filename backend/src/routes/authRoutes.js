/**
 * Routes d'authentification
 */
import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { handleValidation, signupValidation, loginValidation, resetPasswordValidation } from '../middleware/validation.js';

const router = Router();

router.post('/signup', signupValidation, handleValidation, authController.signup);
router.post('/login', loginValidation, handleValidation, authController.login);
router.post('/google', authController.googleAuth);
router.post('/logout', protect, authController.logout);
router.get('/verify-email', authController.verifyEmail);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', resetPasswordValidation, handleValidation, authController.resetPassword);
router.get('/me', protect, authController.me);

export default router;
