/**
 * Routes d'authentification
 */
import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { handleValidation, signupValidation, loginValidation, forgotPasswordValidation, resetPasswordValidation, verifyResetCodeValidation } from '../middleware/validation.js';

const router = Router();

router.post('/send-signup-code', authController.sendSignupCode);
router.post('/verify-signup-code', authController.verifySignupCode);
router.post('/signup', signupValidation, handleValidation, authController.signup);
router.post('/login', loginValidation, handleValidation, authController.login);
router.post('/google', authController.googleAuth);
router.post('/logout', protect, authController.logout);
router.get('/verify-email', authController.verifyEmail);
router.post('/forgot-password', forgotPasswordValidation, handleValidation, authController.forgotPassword);
router.post('/verify-reset-code', verifyResetCodeValidation, handleValidation, authController.verifyResetCode);
router.get('/reset-password/validate', authController.validateResetToken);
router.post('/reset-password', resetPasswordValidation, handleValidation, authController.resetPassword);
router.get('/me', protect, authController.me);

export default router;
