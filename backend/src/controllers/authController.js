import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { 
  sendVerificationEmail, 
  sendPasswordResetCodeEmail, 
  sendSignupCodeEmail,
  isSmtpConfigured 
} from '../utils/email.js';
import { generateToken, hashToken } from '../utils/tokenUtils.js';
import { setCached, getCached, deleteCached } from '../utils/simpleCache.js';

const generateJWT = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES || '7d' });

const jwtCookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  secure: process.env.NODE_ENV === 'production'
};

const getBaseFrontendUrl = (req) => {
  // En production, on essaie d'abord de récupérer l'origine de la requête
  // pour éviter que le lien d'email soit bloqué sur localhost.
  const origin = req.get('origin');
  const envFrontend = process.env.FRONTEND_URL?.split(',')?.[0]?.trim();

  if (process.env.NODE_ENV === 'production') {
    if (origin && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
      return origin;
    }
    if (envFrontend && !envFrontend.includes('localhost') && !envFrontend.includes('127.0.0.1')) {
      return envFrontend;
    }
  }

  if (!origin && req.get('host')) {
     const protocol = req.protocol || 'http';
     const host = req.get('host').split(':')[0];
     return `${protocol}://${host}:5173`;
  }

  return envFrontend || origin || 'http://localhost:5173';
};

const generateSixDigitCode = () => String(Math.floor(100000 + Math.random() * 900000));
const normalizeEmailInput = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '');

export const sendSignupCode = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email requis' });
    const lowercaseEmail = normalizeEmailInput(email);

    // Check if user already exists
    const exists = await User.findOne({ email: lowercaseEmail });
    if (exists) return res.status(400).json({ message: 'Cet email est deja utilise' });

    const code = generateSixDigitCode();
    setCached(`signup_code_${lowercaseEmail}`, code, 10 * 60 * 1000); // 10 minutes

    try {
      await sendSignupCodeEmail(lowercaseEmail, code);
    } catch (emailErr) {
      console.warn('Signup code email error:', emailErr.message);
    }

    const response = { message: 'Code envoye avec succes' };
    if (process.env.NODE_ENV !== 'production' && !isSmtpConfigured()) {
      response.devCode = code;
      console.log('[DEV] Signup code for', email, ':', code);
    }

    res.json(response);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const verifySignupCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ message: 'Email et code requis' });
    const normalizedEmail = normalizeEmailInput(email);

    const cachedCode = getCached(`signup_code_${normalizedEmail}`);
    if (!cachedCode || cachedCode !== String(code)) {
      return res.status(400).json({ message: 'Code invalide ou expire' });
    }

    // Temporarily record that this email is verified for signup (expires in 15 min)
    setCached(`signup_verified_${normalizedEmail}`, 'true', 15 * 60 * 1000);

    res.json({ message: 'Email verifie avec succes' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const signup = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, birthDate, gender, location } = req.body;
    const normalizedEmail = normalizeEmailInput(email);

    const orConditions = [{ email: normalizedEmail }];
    if (username) orConditions.push({ username });
    const exists = await User.findOne({ $or: orConditions });

    if (exists) {
      if (exists.email === email) return res.status(400).json({ message: 'Email deja utilise' });
      if (username && exists.username === username) return res.status(400).json({ message: 'Nom utilisateur deja utilise' });
      return res.status(400).json({ message: 'Utilisateur deja existant' });
    }

    const lowercaseEmail = normalizedEmail;
    const isVerified = getCached(`signup_verified_${lowercaseEmail}`) === 'true';

    const token = isVerified ? undefined : generateToken();
    const user = await User.create({
      username,
      email: lowercaseEmail,
      password,
      firstName,
      lastName,
      birthDate,
      gender,
      location,
      emailVerified: isVerified,
      emailVerificationToken: token ? hashToken(token) : undefined,
      emailVerificationExpires: isVerified ? undefined : Date.now() + 24 * 60 * 60 * 1000
    });

    deleteCached(`signup_code_${lowercaseEmail}`);
    deleteCached(`signup_verified_${lowercaseEmail}`);

    const baseUrl = getBaseFrontendUrl(req);
    if (!isVerified) {
      try {
        await sendVerificationEmail(lowercaseEmail, token, baseUrl);
        console.log(`Verification email sent to ${lowercaseEmail} with baseUrl: ${baseUrl}`);
      } catch (emailErr) {
        console.error('Error sending verification email:', emailErr);
      }
    }

    const jwtToken = generateJWT(user._id);
    res.cookie('token', jwtToken, jwtCookieOptions);
    res.status(201).json({
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        emailVerified: user.emailVerified
      },
      token: jwtToken
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: err.message || 'Erreur serveur' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmailInput(email);
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }
    if (!(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }
    if (user.isBanned) {
      return res.status(403).json({ message: 'Compte desactive' });
    }

    await User.findByIdAndUpdate(user._id, { lastSeen: new Date(), isOnline: true });

    const jwtToken = generateJWT(user._id);
    res.cookie('token', jwtToken, jwtCookieOptions);
    const { password: _, ...userData } = user.toObject();
    res.json({ user: userData, token: jwtToken });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const logout = async (req, res) => {
  try {
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, { isOnline: false });
    }
    res.cookie('token', '', { maxAge: 0, httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
    res.json({ message: 'Deconnexion reussie' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      console.warn('VerifyEmail: Token missing in request');
      return res.status(400).json({ message: 'Token manquant' });
    }

    const hashedToken = hashToken(token);
    console.log('Verifying email with token signature:', hashedToken.substring(0, 8) + '...');

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      console.warn('VerifyEmail: Invalid or expired token');
      return res.status(400).json({ message: 'Lien invalide ou expiré' });
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    // Nettoyer le cache pour éviter que le profil affiche encore "non vérifié"
    deleteCached(`profile:${user._id}`);

    console.log(`Email verified successfully for user: ${user.email}`);
    res.json({ message: 'Email vérifié avec succès' });
  } catch (error) {
    console.error('VerifyEmail Error:', error);
    res.status(500).json({ message: 'Erreur lors de la vérification' });
  }
};

export const resendVerification = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouve' });
    if (user.emailVerified) return res.status(400).json({ message: 'Email deja verifie' });

    const token = generateToken();
    user.emailVerificationToken = token;
    user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    const baseUrl = getBaseFrontendUrl(req);
    try {
      await sendVerificationEmail(user.email, token, baseUrl);
    } catch (emailErr) {
      console.warn('Verification email not resent:', emailErr.message);
    }

    res.json({ message: 'E-mail de verification renvoye' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const genericMessage = 'Si l email existe, un code a ete envoye';

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ message: genericMessage });
    }

    const code = generateSixDigitCode();
    user.passwordResetToken = hashToken(code);
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    try {
      await sendPasswordResetCodeEmail(email, code);
    } catch (emailErr) {
      console.warn('Reset code email not sent:', emailErr.message);
    }

    return res.json({ message: genericMessage });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    const user = await User.findOne({
      email,
      passwordResetToken: hashToken(code),
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Code invalide ou expire' });
    }

    const resetToken = generateToken();
    user.passwordResetToken = hashToken(resetToken);
    user.passwordResetExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    return res.json({ message: 'Code valide', resetToken });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    const user = await User.findOne({
      passwordResetToken: hashToken(token),
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Session de reinitialisation invalide ou expiree' });
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return res.json({ message: 'Mot de passe reinitialise' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const validateResetToken = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ message: 'Token requis', valid: false });
    }

    const user = await User.findOne({
      passwordResetToken: hashToken(token),
      passwordResetExpires: { $gt: Date.now() }
    }).select('_id');

    if (!user) {
      return res.status(400).json({ message: 'Session invalide ou expiree', valid: false });
    }

    return res.json({ valid: true });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur', valid: false });
  }
};

export const me = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -emailVerificationToken -passwordResetToken');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!user || !(await user.comparePassword(oldPassword))) {
      return res.status(401).json({ message: 'Ancien mot de passe incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Mot de passe modifie avec succes' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
