/**
 * Auth controller
 */
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import { 
  sendVerificationEmail, 
  sendPasswordResetCodeEmail, 
  sendSignupCodeEmail,
  isSmtpConfigured 
} from '../utils/email.js';
import { generateToken, hashToken } from '../utils/tokenUtils.js';
import { setCached, getCached } from '../utils/simpleCache.js';

const generateJWT = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES || '7d' });

const jwtCookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  secure: process.env.NODE_ENV === 'production'
};

const getBaseFrontendUrl = (req) => {
  const envFrontend = process.env.FRONTEND_URL?.split(',')?.[0]?.trim();
  if (envFrontend) return envFrontend;
  return req.get('origin') || 'http://localhost:5173';
};

const generateSixDigitCode = () => String(Math.floor(100000 + Math.random() * 900000));

export const sendSignupCode = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email requis' });

    // Check if user already exists
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Cet email est deja utilise' });

    const code = generateSixDigitCode();
    setCached(`signup_code_${email}`, code, 10 * 60 * 1000); // 10 minutes

    try {
      await sendSignupCodeEmail(email, code);
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

    const cachedCode = getCached(`signup_code_${email}`);
    if (!cachedCode || cachedCode !== String(code)) {
      return res.status(400).json({ message: 'Code invalide ou expire' });
    }

    // Temporarily record that this email is verified for signup (expires in 15 min)
    setCached(`signup_verified_${email}`, 'true', 15 * 60 * 1000);

    res.json({ message: 'Email verifie avec succes' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const signup = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, birthDate, gender, location } = req.body;

    const orConditions = [{ email }];
    if (username) orConditions.push({ username });
    const exists = await User.findOne({ $or: orConditions });

    if (exists) {
      if (exists.email === email) return res.status(400).json({ message: 'Email deja utilise' });
      if (username && exists.username === username) return res.status(400).json({ message: 'Nom utilisateur deja utilise' });
      return res.status(400).json({ message: 'Utilisateur deja existant' });
    }

    const isVerified = getCached(`signup_verified_${email}`) === 'true';

    const token = isVerified ? undefined : generateToken();
    const user = await User.create({
      username,
      email,
      password,
      firstName,
      lastName,
      birthDate,
      gender,
      location,
      emailVerified: isVerified,
      emailVerificationToken: token,
      emailVerificationExpires: isVerified ? undefined : Date.now() + 24 * 60 * 60 * 1000
    });

    const baseUrl = getBaseFrontendUrl(req);
    if (!isVerified) {
      try {
        await sendVerificationEmail(email, token, baseUrl);
      } catch (emailErr) {
        console.warn('Verification email not sent:', emailErr.message);
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
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }
    if (user.googleId) {
      return res.status(400).json({ message: 'Ce compte utilise Google. Connectez-vous avec Google.' });
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
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Token invalide ou expire' });
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.json({ message: 'Email verifie avec succes' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const genericMessage = 'Si l email existe, un code a ete envoye';

    const user = await User.findOne({ email });
    if (!user || user.googleId) {
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

export const googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ message: 'Token Google requis' });
    }

    const audiences = [
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_ANDROID_CLIENT_ID,
      process.env.GOOGLE_IOS_CLIENT_ID,
      process.env.GOOGLE_WEB_CLIENT_ID,
      process.env.GOOGLE_EXPO_CLIENT_ID
    ].filter(Boolean);

    if (!audiences.length) {
      return res.status(500).json({ message: 'Google OAuth non configure (client IDs manquants)' });
    }

    const googleClient = new OAuth2Client();
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: audiences
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, given_name: firstName, family_name: lastName, picture: googlePhoto } = payload;

    let user = await User.findOne({ $or: [{ googleId }, { email }] });
    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        user.googlePhoto = googlePhoto;
        user.emailVerified = true;
        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        await user.save();
      } else if (user.googleId !== googleId) {
        return res.status(400).json({ message: 'Cet email est deja utilise avec un autre compte' });
      }
    } else {
      const baseUsername = email.split('@')[0];
      const randomString = Math.floor(Math.random() * 10000).toString();
      const generatedUsername = `${baseUsername}${randomString}`;
      user = await User.create({
        username: generatedUsername,
        email,
        googleId,
        googlePhoto,
        firstName: firstName || 'Utilisateur',
        lastName: lastName || '',
        birthDate: new Date('2000-01-01'),
        gender: 'other',
        emailVerificationToken: undefined,
        emailVerificationExpires: undefined,
        emailVerified: true
      });
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
    console.error('Erreur Google auth:', err);
    res.status(500).json({ message: err.message || 'Erreur authentification Google' });
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
