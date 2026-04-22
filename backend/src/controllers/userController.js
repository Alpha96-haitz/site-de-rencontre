/**
 * Contrôleur utilisateur - Profil et recherche
 */
import User from '../models/User.js';
import Match from '../models/Match.js';
import cloudinary from '../config/cloudinary.js';
import { getCached, setCached, clearCacheByPrefix } from '../utils/simpleCache.js';

const resolvePublicIdFromReq = (req) => {
  const raw = req.params?.publicId || req.params?.['0'] || '';
  if (!raw) return '';
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
};

// Obtenir le profil public d'un utilisateur
export const getProfile = async (req, res) => {
  try {
    const isMeRequest = req.params.id === 'me' || req.params.id === req.user?._id?.toString();
    const queryId = isMeRequest ? req.user._id : req.params.id;

    const cacheKey = `profile:${queryId}`;
    const cached = getCached(cacheKey);
    
    let user;
    if (cached) {
      user = cached;
    } else {
      const dbQuery = queryId.toString().match(/^[0-9a-fA-F]{24}$/) ? { _id: queryId } : { username: queryId };
      user = await User.findOne(dbQuery)
        .select('username profilePicture coverPicture followers following firstName lastName age gender bio photos googlePhoto interests location privacy notificationPreferences lastSeen isOnline emailVerified createdAt birthDate')
        .populate('photos')
        .populate('followers following', 'firstName lastName photos googlePhoto username');
      
      if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
      setCached(cacheKey, user, 30000);
    }

    // Convert to object to add virtual fields
    const userObj = user.toObject ? user.toObject() : JSON.parse(JSON.stringify(user));

    // Add match status if requester is not the same user
    if (req.user && req.user._id.toString() !== userObj._id.toString()) {
      const match = await Match.findOne({
        $or: [
          { likedBy: req.user._id, likedUser: userObj._id },
          { likedBy: userObj._id, likedUser: req.user._id }
        ]
      });

      userObj.matchStatus = {
        isMutual: match?.isMutual || false,
        hasLiked: !!match && match.likedBy?.toString() === req.user._id.toString(),
        matchId: match?.isMutual ? match._id : null
      };
    } else if (req.user && req.user._id.toString() === userObj._id.toString()) {
       userObj.isMe = true;
    }

    res.json(userObj);
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
    const publicId = resolvePublicIdFromReq(req);
    if (!publicId) return res.status(400).json({ message: 'publicId invalide' });
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
    const publicId = resolvePublicIdFromReq(req);
    if (!publicId) return res.status(400).json({ message: 'publicId invalide' });
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

    // Filtrer les utilisateurs déjà likés ou dislikés
    const settledMatches = await Match.find({ likedBy: currentUser }).select('likedUser');
    const settledIds = settledMatches.map(m => m.likedUser.toString());
    query._id = { ...query._id, $nin: settledIds };

    const users = await User.find(query)
      .select('firstName lastName age gender bio photos googlePhoto interests username location')
      .limit(parseInt(limit))
      .skip(skip)
      .lean();
    
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Suggestions intelligentes (profil + compatibilité)
export const getSuggestions = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const recycle = req.query.recycle === 'true';
    const currentUser = req.user._id;

    // Récupérer les IDs des personnes déjà traitées
    const settledMatches = await Match.find({ likedBy: currentUser }).select('likedUser');
    const settledIds = settledMatches.map(m => m.likedUser.toString());

    const userPref = await User.findById(currentUser).select('interestedIn');
    const preferences = userPref?.interestedIn || ['all'];

    let query = { 
      _id: { $ne: currentUser, $nin: settledIds }, 
      isBanned: false 
    };

    if (!preferences.includes('all')) {
      query.gender = { $in: preferences };
    }

    let users = await User.find(query)
      .select('firstName lastName birthDate gender bio photos googlePhoto interests username location')
      .limit(limit)
      .lean();
    
    // Calcul de l'âge car lean() ne supporte pas les virtuals
    users = users.map(u => {
      let age = null;
      if (u.birthDate) {
        const today = new Date();
        const birth = new Date(u.birthDate);
        age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
      }
      return { ...u, age };
    });
      
    if (recycle && users.length < 5) {
      // Recycler uniquement ceux avec type 'dislike'
      const passedMatches = await Match.find({ likedBy: currentUser, type: 'dislike' }).select('likedUser');
      const passedIds = passedMatches.map(m => m.likedUser.toString());
      
      if (passedIds.length > 0) {
        const recycledUsers = await User.find({
          _id: { $ne: currentUser, $in: passedIds },
          isBanned: false
        })
          .select('firstName lastName birthDate gender bio photos googlePhoto interests username location')
          .limit(30)
          .lean();
          
        const taggedRecycled = recycledUsers.map(u => {
          let age = null;
          if (u.birthDate) {
            const today = new Date();
            const birth = new Date(u.birthDate);
            age = today.getFullYear() - birth.getFullYear();
            const m = today.getMonth() - birth.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
          }
          return { ...u, age, isRecycled: true };
        });
        users = [...users, ...taggedRecycled];
      }
    }

    // Fallback recycle robuste:
    // Si aucun profil n'est disponible (ex: tout le monde deja like/dislike),
    // on renvoie un nouveau lot global pour eviter un deck vide permanent.
    if (recycle && users.length === 0) {
      const fallbackQuery = {
        _id: { $ne: currentUser },
        isBanned: false
      };

      if (!preferences.includes('all')) {
        fallbackQuery.gender = { $in: preferences };
      }

      const fallbackUsers = await User.find(fallbackQuery)
        .select('firstName lastName birthDate gender bio photos googlePhoto interests username location')
        .limit(limit)
        .lean();

      users = fallbackUsers.map((u) => {
        let age = null;
        if (u.birthDate) {
          const today = new Date();
          const birth = new Date(u.birthDate);
          age = today.getFullYear() - birth.getFullYear();
          const m = today.getMonth() - birth.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        }
        return { ...u, age, isRecycled: true };
      });
    }
    
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
      
      const io = req.app.get('io');
      if (io) {
        const { notifyUserStats } = await import('../socket/index.js');
        // Notify targeted user about new follower count
        notifyUserStats(io, req.params.id, { followersCount: user.followers.length + 1 });
        // Notify current user about their new following count
        notifyUserStats(io, req.user._id, { followingCount: currentUser.following.length + 1 });
      }

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

      const io = req.app.get('io');
      if (io) {
        const { notifyUserStats } = await import('../socket/index.js');
        notifyUserStats(io, req.params.id, { followersCount: Math.max(0, user.followers.length - 1) });
        notifyUserStats(io, req.user._id, { followingCount: Math.max(0, currentUser.following.length - 1) });
      }

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
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    
    // Supprimer les photos sur Cloudinary
    if (user.photos) {
      for (const photo of user.photos) {
        if (photo.publicId) await cloudinary.uploader.destroy(photo.publicId).catch(() => {});
      }
    }
    
    // 1. Récupérer les IDs des matches pour nettoyer les messages associés
    const matchesIds = await Match.find({ users: userId }).distinct('_id');

    // On récupère aussi les personnes affectées par la suppression des abonnements pour les notifier
    const affectedFollowers = await User.find({ following: userId }).select('_id following');
    const affectedFollowing = await User.find({ followers: userId }).select('_id followers');

    await Promise.all([
      // Suppression du compte
      User.findByIdAndDelete(userId),
      
      // Suppression des contenus créés
      Post.deleteMany({ userId }),
      Message.deleteMany({ $or: [
        { sender: userId }, 
        { match: { $in: matchesIds } }
      ]}),
      Match.deleteMany({ $or: [
        { users: userId }, 
        { likedBy: userId }, 
        { likedUser: userId }
      ]}),
      Report.deleteMany({ $or: [
        { reporter: userId }, 
        { reportedUser: userId }
      ]}),
      Notification.deleteMany({ $or: [
        { recipient: userId }, 
        { sender: userId }
      ]}),
      
      // Nettoyage des interactions sur d'autres utilisateurs (followers/following)
      User.updateMany({ followers: userId }, { $pull: { followers: userId } }),
      User.updateMany({ following: userId }, { $pull: { following: userId } }),
      
      // Nettoyage des interactions sur d'autres posts (likes/commentaires)
      Post.updateMany({ likes: userId }, { $pull: { likes: userId } }),
      Post.updateMany(
        { 'comments.userId': userId }, 
        { $pull: { comments: { userId: userId } } }
      )
    ]);

    // Émettre les mises à jour socket pour les compteurs
    const io = req.app.get('io');
    if (io) {
      const { notifyUserStats, notifyUserDeleted } = await import('../socket/index.js');
      
      // Notifier la suppression de l'utilisateur
      notifyUserDeleted(io, userId);

      // Notifier ceux qui le suivaient (leur followingCount diminue)
      affectedFollowers.forEach(u => {
        notifyUserStats(io, u._id, { followingCount: Math.max(0, u.following.length - 1) });
      });

      // Notifier ceux qu'il suivait (leur followersCount diminue)
      affectedFollowing.forEach(u => {
        notifyUserStats(io, u._id, { followersCount: Math.max(0, u.followers.length - 1) });
      });
    }

    res.json({ message: 'Compte supprimé avec succès' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
