/**
 * Contrôleur d'authentification
 */
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email.js';
import { generateToken } from '../utils/tokenUtils.js';

const generateJWT = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES || '7d' });

export const signup = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, birthDate, gender, location } = req.body;
    
    // Vérifier si l'utilisateur existe déjà
    const orConditions = [{ email }];
    if (username) orConditions.push({ username });
    const exists = await User.findOne({ $or: orConditions });
    
    if (exists) {
      if (exists.email === email) return res.status(400).json({ message: 'Email déjà utilisé' });
      if (username && exists.username === username) return res.status(400).json({ message: 'Nom d\'utilisateur déjà utilisé' });
      return res.status(400).json({ message: 'L\'utilisateur existe déjà' });
    }
    const token = generateToken();
    const user = await User.create({
      username, email, password, firstName, lastName, birthDate, gender, location,
      emailVerificationToken: token,
      emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000
    });
    const baseUrl = req.get('origin') || process.env.FRONTEND_URL || 'http://localhost:5173';
    try {
      await sendVerificationEmail(email, token, baseUrl);
    } catch (emailErr) {
      console.warn('Email de vérification non envoyé (SMTP non configuré?) :', emailErr.message);
      // L'inscription réussit quand même - l'utilisateur peut vérifier plus tard
    }
    const jwtToken = generateJWT(user._id);
    res.cookie('token', jwtToken, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000, secure: process.env.NODE_ENV === 'production' });
    res.status(201).json({
      user: { id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName, emailVerified: user.emailVerified },
      token: jwtToken
    });
  } catch (err) {
    console.error('Erreur signup:', err);
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
      return res.status(403).json({ message: 'Compte désactivé' });
    }
    await User.findByIdAndUpdate(user._id, { lastSeen: new Date(), isOnline: true });
    const jwtToken = generateJWT(user._id);
    res.cookie('token', jwtToken, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000, secure: process.env.NODE_ENV === 'production' });
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
    res.cookie('token', '', { maxAge: 0 });
    res.json({ message: 'Déconnexion réussie' });
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
      return res.status(400).json({ message: 'Token invalide ou expiré' });
    }
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();
    res.json({ message: 'Email vérifié avec succès' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ message: 'Si l\'email existe, un lien a été envoyé' }); // Ne pas révéler
    }
    const token = generateToken();
    user.passwordResetToken = token;
    user.passwordResetExpires = Date.now() + 60 * 60 * 1000;
    await user.save();
    const baseUrl = req.get('origin') || process.env.FRONTEND_URL || 'http://localhost:5173';
    try {
      await sendPasswordResetEmail(email, token, baseUrl);
    } catch (emailErr) {
      console.warn('Email de réinitialisation non envoyé (SMTP non configuré?) :', emailErr.message);
    }
    res.json({ message: 'Si l\'email existe, un lien a été envoyé' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });
    if (!user) {
      return res.status(400).json({ message: 'Token invalide ou expiré' });
    }
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    res.json({ message: 'Mot de passe réinitialisé' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ message: 'Token Google requis' });
    }
    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({ message: 'Google OAuth non configuré (GOOGLE_CLIENT_ID manquant)' });
    }
    const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
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
        return res.status(400).json({ message: 'Cet email est déjà utilisé avec un autre compte' });
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
      return res.status(403).json({ message: 'Compte désactivé' });
    }
    await User.findByIdAndUpdate(user._id, { lastSeen: new Date(), isOnline: true });
    const jwtToken = generateJWT(user._id);
    res.cookie('token', jwtToken, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000, secure: process.env.NODE_ENV === 'production' });
    const { password: _, ...userData } = user.toObject();
    res.json({ user: userData, token: jwtToken });
  } catch (err) {
    console.error('Erreur Google auth:', err);
    res.status(500).json({ message: err.message || 'Erreur d\'authentification Google' });
  }
};

export const me = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -emailVerificationToken -passwordResetToken');
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
    res.json({ message: 'Mot de passe modifié avec succès' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
