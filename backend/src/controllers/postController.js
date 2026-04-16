import Post from '../models/Post.js';
import cloudinary from '../config/cloudinary.js';
import { createNotification } from './notificationController.js';
import { getCached, setCached, clearCacheByPrefix } from '../utils/simpleCache.js';
import { notifyNewPost, notifyPostLike, notifyPostComment } from '../socket/index.js';

const escapeHtml = (str) => String(str || '').normalize('NFC')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

export const createPost = async (req, res) => {
  try {
    const uploadOneFile = async (file) => {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Cloudinary upload timeout (60s)')), 60000);
        const b64 = Buffer.from(file.buffer).toString('base64');
        const dataURI = `data:${file.mimetype};base64,${b64}`;

        cloudinary.uploader.upload(
          dataURI,
          {
            folder: 'posts',
            resource_type: 'image',
            transformation: [
              { fetch_format: 'auto', quality: 'auto:good' },
              { width: 1400, crop: 'limit' }
            ]
          },
          (uploadErr, uploadRes) => {
            clearTimeout(timeout);
            if (uploadErr) return reject(uploadErr);
            resolve(uploadRes.secure_url);
          }
        );
      });
    };

    const singleFile = req.files?.image?.[0] || req.file || null;
    const multiFiles = Array.isArray(req.files?.images) ? req.files.images : [];
    const filesToUpload = [...(singleFile ? [singleFile] : []), ...multiFiles].slice(0, 4);

    const uploadedImages = [];
    for (const file of filesToUpload) {
      // Upload sequentially to keep memory and request pressure stable
      const url = await uploadOneFile(file);
      uploadedImages.push(url);
    }

    const postData = { ...req.body };
    if (typeof postData.image === 'object') delete postData.image;
    if (typeof postData.images === 'object') delete postData.images;

    const savedPost = await new Post({
      ...postData,
      userId: req.user._id,
      image: uploadedImages[0] || (typeof req.body.image === 'string' ? req.body.image : ''),
      images: uploadedImages.length ? uploadedImages : []
    }).save();

    clearCacheByPrefix('timeline:');
    const populatedPost = await Post.findById(savedPost._id)
      .populate('userId', 'firstName lastName username photos googlePhoto isOnline')
      .populate('comments.userId', 'firstName lastName username photos googlePhoto')
      .lean();

    const io = req.app.get('io');
    if (io) {
      notifyNewPost(io, populatedPost || savedPost);
    }

    res.status(201).json(populatedPost || savedPost);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getTimelinePosts = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 30, 100);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const skip = (page - 1) * limit;
    const cacheKey = `timeline:${page}:${limit}`;

    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    const posts = await Post.find()
      .populate('userId', 'firstName lastName username photos googlePhoto isOnline')
      .populate('comments.userId', 'firstName lastName username photos googlePhoto')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    setCached(cacheKey, posts, 15000);
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getUserPosts = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 30, 100);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const skip = (page - 1) * limit;

    const posts = await Post.find({ userId: req.params.userId })
      .populate('userId', 'firstName lastName username photos googlePhoto isOnline')
      .populate('comments.userId', 'firstName lastName username photos googlePhoto')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Publication introuvable' });

    const isLiked = post.likes.some(id => id.toString() === req.user._id.toString());
    const io = req.app.get('io');

    if (!isLiked) {
      // Utiliser $addToSet pour etre sur a 100% de l unicite au niveau DB
      const updatedPost = await Post.findByIdAndUpdate(
        req.params.id, 
        { $addToSet: { likes: req.user._id } }, 
        { new: true }
      );
      
      clearCacheByPrefix('timeline:');

      createNotification({
        recipient: post.userId,
        sender: req.user._id,
        type: 'like',
        post: post._id
      });

      if (io) {
        notifyPostLike(io, post._id, updatedPost.likes, req.user._id);
      }

      return res.json({ message: 'J\'aime ajouté', likes: updatedPost.likes });
    } else {
      const updatedPost = await Post.findByIdAndUpdate(
        req.params.id, 
        { $pull: { likes: req.user._id } }, 
        { new: true }
      );
      
      clearCacheByPrefix('timeline:');

      if (io) {
        notifyPostLike(io, post._id, updatedPost.likes, req.user._id);
      }

      return res.json({ message: 'J\'aime retiré', likes: updatedPost.likes });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const commentPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Publication introuvable' });

    const newComment = {
      userId: req.user._id,
      text: escapeHtml(req.body.text.trim())
    };

    post.comments.push(newComment);
    await post.save();
    clearCacheByPrefix('timeline:');

    // On recupere le commentaire avec les infos utilisateur pour le socket
    const populated = await Post.findById(post._id)
      .select('comments')
      .populate('comments.userId', 'firstName lastName username photos googlePhoto');
    
    const lastComment = populated.comments[populated.comments.length - 1];

    createNotification({
      recipient: post.userId,
      sender: req.user._id,
      type: 'comment',
      post: post._id,
      content: req.body.text
    });

    const io = req.app.get('io');
    if (io) {
      notifyPostComment(io, post._id, lastComment);
    }

    res.json({ message: 'Commentaire ajouté', comment: lastComment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post non trouve' });

    if (post.userId.toString() !== req.user._id.toString() && req.user.role !== 'root') {
      return res.status(403).json({ message: 'Action non autorisee' });
    }

    const updates = {};
    if (req.body.desc !== undefined) updates.desc = req.body.desc;
    if (typeof req.body.image === 'string' && req.body.image.trim()) {
      updates.image = req.body.image.trim();
    }

    const updated = await Post.findByIdAndUpdate(post._id, updates, { new: true })
      .populate('userId', 'firstName lastName username photos googlePhoto isOnline');

    clearCacheByPrefix('timeline:');
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post non trouve' });
    if (post.userId.toString() !== req.user._id.toString() && req.user.role !== 'root') {
      return res.status(403).json({ message: 'Action non autorisee' });
    }

    await post.deleteOne();
    clearCacheByPrefix('timeline:');
    res.json({ message: 'Post supprime' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('userId', 'firstName lastName username photos googlePhoto isOnline')
      .populate('comments.userId', 'firstName lastName username photos googlePhoto')
      .lean();

    if (!post) return res.status(404).json({ message: 'Publication introuvable' });
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
