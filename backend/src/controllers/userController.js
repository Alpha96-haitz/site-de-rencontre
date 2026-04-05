/**
 * Contrôleur utilisateur - Profil et recherche
 */
import User from '../models/User.js';
import Match from '../models/Match.js';
import cloudinary from '../config/cloudinary.js';
import { getCached, setCached, clearCacheByPrefix } from '../utils/simpleCache.js';

// Obtenir le profil public d'un utilisateur
export const getProfile = async (req, res) => {
  try {
    const cacheKey = `profile:${req.params.id}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    const query = req.params.id.match(/^[0-9a-fA-F]{24}$/) ? { _id: req.params.id } : { username: req.params.id };
    const user = await User.findOne(query)
      .select('username profilePicture coverPicture followers following firstName lastName age gender bio photos googlePhoto interests location privacy notificationPreferences lastSeen isOnline createdAt')
      .populate('photos')
      .populate('followers following', 'firstName lastName photos googlePhoto username');
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
    setCached(cacheKey, user, 30000);
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Mettre à jour son profil
export const updateProfile = async (req, res) => {
  try {
    const allowed = ['username', 'profilePicture', 'coverPicture', 'firstName', 'lastName', 'birthDate', 'gender', 'bio', 'interests', 'interestedIn', 'ageRange', 'location', 'privacy', 'notificationPreferences'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');
    clearCacheByPrefix('profile:');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Upload photo (Cloudinary)
export const uploadPhoto = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Fichier requis' });
    
    const result = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Cloudinary upload timeout (60s)"));
      }, 60000);

      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const dataURI = "data:" + req.file.mimetype + ";base64," + b64;

      cloudinary.uploader.upload(
        dataURI,
        {
          folder: 'haitz-rencontre/photos',
          resource_type: 'image',
          transformation: [
            { fetch_format: 'auto', quality: 'auto:good' },
            { width: 1200, crop: 'limit' }
          ]
        },
        (uploadErr, uploadRes) => {
        clearTimeout(timeout);
        if (uploadErr) {
          console.error("Cloudinary User Photo Upload Error:", uploadErr);
          return reject(uploadErr);
        }
        resolve(uploadRes);
      });
    });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    
    const isPrimary = user.photos.length === 0;
    const newPhoto = { 
      url: result.secure_url, 
      publicId: result.public_id, 
      isPrimary 
    };
    
    user.photos.push(newPhoto);
    
    // Si c'est la première photo ou si c'est marqué primaire, on met à jour profilePicture
    if (isPrimary) {
      user.profilePicture = result.secure_url;
    }
    
    // Sauvegarder sans forcer la re-validation de tous les champs (évite les erreurs 500 si birthDate ou autre manque)
    await user.save({ validateBeforeSave: false });
    clearCacheByPrefix('profile:');
    res.json({ photos: user.photos, user });
  } catch (err) {
    console.error("Upload Error Details:", err);
    res.status(500).json({ 
      message: "Erreur serveur lors de l'upload de l'image", 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};
// Upload photo de couverture (Cloudinary)
export const uploadCover = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Fichier requis' });
    
    const result = await new Promise((resolve, reject) => {
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const dataURI = "data:" + req.file.mimetype + ";base64," + b64;
      cloudinary.uploader.upload(dataURI, {
        folder: 'haitz-rencontre/covers',
        resource_type: 'image',
        transformation: [
          { fetch_format: 'auto', quality: 'auto:good' },
          { width: 1600, crop: 'limit' }
        ]
      }, (uploadErr, uploadRes) => {
        if (uploadErr) return reject(uploadErr);
        resolve(uploadRes);
      });
    });

    const user = await User.findByIdAndUpdate(req.user._id, { coverPicture: result.secure_url }, { new: true }).select('-password');
    clearCacheByPrefix('profile:');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Supprimer photo
export const deletePhoto = async (req, res) => {
  try {
    const { publicId } = req.params;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvÃ©' });

    user.photos = user.photos.filter(p => p.publicId !== publicId);
    if (user.photos.length && !user.photos.some(p => p.isPrimary)) {
      user.photos[0].isPrimary = true;
    }
    const primary = user.photos.find(p => p.isPrimary) || user.photos[0];
    user.profilePicture = primary?.url || '';
    await cloudinary.uploader.destroy(publicId).catch(() => {});
    await user.save();
    clearCacheByPrefix('profile:');
    res.json({ photos: user.photos, profilePicture: user.profilePicture });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Definir une photo comme photo de profil
export const setPrimaryPhoto = async (req, res) => {
  try {
    const { publicId } = req.params;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvÃ©' });

    const selected = user.photos.find(p => p.publicId === publicId);
    if (!selected) {
      return res.status(404).json({ message: 'Photo introuvable' });
    }

    user.photos = user.photos.map(photo => ({
      ...photo.toObject(),
      isPrimary: photo.publicId === publicId
    }));
    user.profilePicture = selected.url;

    await user.save({ validateBeforeSave: false });
    clearCacheByPrefix('profile:');
    res.json({ photos: user.photos, profilePicture: user.profilePicture });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Recherche avec filtres et texte
export const search = async (req, res) => {
  try {
    const { q, ageMin, ageMax, gender, interests, maxDistance, limit = 100, page = 1 } = req.query;
    const currentUser = req.user._id;
    
    const query = { _id: { $ne: currentUser }, isBanned: false };
    
    if (q) {
      query.$or = [
        { firstName: { $regex: q, $options: 'i' } },
        { lastName: { $regex: q, $options: 'i' } },
        { username: { $regex: q, $options: 'i' } }
      ];
    }
    
    if (gender) query.gender = gender;
    
    if (ageMin || ageMax) {
      query.$and = query.$and || [];
      const today = new Date();
      if (ageMin) {
        const maxBirth = new Date(today);
        maxBirth.setFullYear(today.getFullYear() - parseInt(ageMin));
        query.$and.push({ birthDate: { $lte: maxBirth } });
      }
      if (ageMax) {
        const minBirth = new Date(today);
        minBirth.setFullYear(today.getFullYear() - parseInt(ageMax) - 1);
        query.$and.push({ birthDate: { $gt: minBirth } });
      }
    }
    
    if (interests) {
      const arr = interests.split(',').map(s => s.trim());
      query.interests = { $in: arr };
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    let users = await User.find(query)
      .select('firstName lastName age gender bio photos googlePhoto interests username')
      .limit(parseInt(limit))
      .skip(skip)
      .lean();
    
    // Désactivation de l'exclusion des utilisateurs déjà likés/dislikés selon la demande de l'utilisateur
    /*
    const likes = await Match.find({ likedBy: currentUser }).select('likedUser');
    const likedIds = likes.map(m => m.likedUser.toString());
    users = users.filter(u => !likedIds.includes(u._id.toString()));
    */
    
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Suggestions intelligentes (profil + compatibilité)
export const getSuggestions = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const interactions = await Match.find({
      $or: [{ likedBy: req.user._id }, { likedUser: req.user._id }]
    })
      .select('likedBy likedUser')
      .lean();

    const excludedIds = new Set([req.user._id.toString()]);
    interactions.forEach((row) => {
      excludedIds.add(row.likedBy.toString());
      excludedIds.add(row.likedUser.toString());
    });

    const query = { _id: { $nin: Array.from(excludedIds) }, isBanned: false };
    const users = await User.find(query)
      .select('firstName lastName age gender bio photos googlePhoto interests username')
      .limit(limit)
      .lean();
    
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// S'abonner à un utilisateur
export const followUser = async (req, res) => {
  if (req.user._id.toString() === req.params.id) {
    return res.status(403).json({ message: "Vous ne pouvez pas vous abonner à vous-même" });
  }
  try {
    const user = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user._id);

    if (!user.followers.includes(req.user._id)) {
      await user.updateOne({ $push: { followers: req.user._id } });
      await currentUser.updateOne({ $push: { following: req.params.id } });
      clearCacheByPrefix('profile:');
      
      // Notification
      const { createNotification } = await import('./notificationController.js');
      createNotification({
        recipient: req.params.id,
        sender: req.user._id,
        type: 'follow'
      });

      res.json({ message: "Vous êtes maintenant abonné à cet utilisateur" });
    } else {
      res.status(403).json({ message: "Vous êtes déjà abonné à cet utilisateur" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Se désabonner d'un utilisateur
export const unfollowUser = async (req, res) => {
  if (req.user._id.toString() === req.params.id) {
    return res.status(403).json({ message: "Action impossible" });
  }
  try {
    const user = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user._id);

    if (user.followers.includes(req.user._id)) {
      await user.updateOne({ $pull: { followers: req.user._id } });
      await currentUser.updateOne({ $pull: { following: req.params.id } });
      clearCacheByPrefix('profile:');
      res.json({ message: "Vous n'êtes plus abonné à cet utilisateur" });
    } else {
      res.status(403).json({ message: "Vous n'êtes pas abonné à cet utilisateur" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// Supprimer son compte
export const deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    
    // Supprimer les photos sur Cloudinary
    for (const photo of user.photos) {
      if (photo.publicId) await cloudinary.uploader.destroy(photo.publicId).catch(() => {});
    }
    
    await User.findByIdAndDelete(req.user._id);
    // On pourrait aussi supprimer ses matchs, ses messages, ses notifications, ses posts...
    await Match.deleteMany({ users: req.user._id });
    
    res.json({ message: 'Compte supprimé avec succès' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
