/**
 * Validation des requêtes (express-validator)
 */
import { body, param, validationResult } from 'express-validator';

export const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

export const signupValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').trim().notEmpty(),
  body('lastName').trim().notEmpty(),
  body('birthDate').isISO8601(),
  body('gender').isIn(['male', 'female', 'other'])
];

export const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
];

export const resetPasswordValidation = [
  body('token').notEmpty(),
  body('password').isLength({ min: 6 })
];
