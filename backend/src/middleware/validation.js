/**
 * Validation des requêtes (express-validator)
 */
import mongoose from 'mongoose';
import { body, param, validationResult } from 'express-validator';

const isMongoId = (value) => mongoose.Types.ObjectId.isValid(value);
const normalizeText = (value) => (typeof value === 'string' ? value.normalize('NFC') : value);

export const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

export const signupValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).trim(),
  body('username').trim().notEmpty().isLength({ min: 3, max: 32 }).matches(/^[a-zA-Z0-9_]+$/).withMessage('Le nom d\'utilisateur ne doit contenir que des lettres, chiffres et underscores sans espaces'),
  body('firstName').trim().customSanitizer(normalizeText).notEmpty().escape(),
  body('lastName').trim().customSanitizer(normalizeText).notEmpty().escape(),
  body('birthDate').isISO8601(),
  body('gender').notEmpty().isIn(['male', 'female', 'other']),
  body('location.city').trim().customSanitizer(normalizeText).notEmpty().escape().withMessage('La ville est requise')
];

export const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').trim().notEmpty().escape()
];

export const forgotPasswordValidation = [
  body('email').isEmail().normalizeEmail()
];

export const resetPasswordValidation = [
  body('token').trim().notEmpty().escape(),
  body('password').isLength({ min: 6 }).trim()
];

export const verifyResetCodeValidation = [
  body('email').isEmail().normalizeEmail(),
  body('code').trim().matches(/^\d{6}$/)
];

export const changePasswordValidation = [
  body('oldPassword').trim().notEmpty().escape(),
  body('newPassword').isLength({ min: 6 }).trim()
];

export const profileValidation = [
  body('username').optional({ checkFalsy: true }).trim().isLength({ min: 3, max: 32 }).matches(/^[a-zA-Z0-9_]+$/).withMessage('Nom d\'utilisateur invalide'),
  body('firstName').optional().trim().customSanitizer(normalizeText),
  body('lastName').optional().trim().customSanitizer(normalizeText),
  body('bio').optional().trim().customSanitizer(normalizeText).isLength({ max: 500 }).withMessage('La bio ne doit pas dépasser 500 caractères'),
  body('interests').optional().isArray().withMessage('Les intérêts doivent être une liste'),
  body('privacy').optional().isObject(),
  body('notificationPreferences').optional().isObject()
];

export const postValidation = [
  body('desc').optional().trim().customSanitizer(normalizeText).isLength({ max: 500 }).escape(),
  body('image').optional().trim().isURL().withMessage('Image URL invalide')
];

export const commentValidation = [
  body('text').trim().customSanitizer(normalizeText).notEmpty().isLength({ max: 300 }).escape()
];

export const reportValidation = [
  body('reportedUserId')
    .trim()
    .notEmpty()
    .custom(isMongoId)
    .withMessage('Identifiant utilisateur invalide'),
  body('reason').trim().customSanitizer(normalizeText).notEmpty().isLength({ max: 200 }).escape(),
  body('description').optional().trim().customSanitizer(normalizeText).isLength({ max: 1000 }).escape()
];

export const idValidation = (field) => [
  param(field)
    .trim()
    .notEmpty()
    .custom(isMongoId)
    .withMessage(`${field} invalide`)
];
