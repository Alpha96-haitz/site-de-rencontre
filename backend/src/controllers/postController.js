import Post from '../models/Post.js';
import cloudinary from '../config/cloudinary.js';
import { createNotification } from './notificationController.js';
import { getCached, setCached, clearCacheByPrefix } from '../utils/simpleCache.js';

const escapeHtml = (str) => String(str || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

export const createPost = async (req, res) => {
  try {
    let imageUrl = '';

    if (req.file) {
      imageUrl = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Cloudinary upload timeout (60s)')), 60000);
        const b64 = Buffer.from(req.file.buffer).toString('base64');
        const dataURI = `data:${req.file.mimetype};base64,${b64}`;

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
    }

    const postData = { ...req.body };
    if (typeof postData.image === 'object') delete postData.image;

    const savedPost = await new Post({
      ...postData,
      userId: req.user._id,
      image: imageUrl || (typeof req.body.image === 'string' ? req.body.image : '')
    }).save();

    clearCacheByPrefix('timeline:');
    res.status(201).json(savedPost);
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
    if (!post) return res.status(404).json({ message: 'Post non trouve' });

    if (!post.likes.includes(req.user._id)) {
      await post.updateOne({ $push: { likes: req.user._id } });
      clearCacheByPrefix('timeline:');

      createNotification({
        recipient: post.userId,
        sender: req.user._id,
        type: 'like',
        post: post._id
      });

      return res.json({ message: 'Le post a ete like' });
    }

    await post.updateOne({ $pull: { likes: req.user._id } });
    clearCacheByPrefix('timeline:');
    return res.json({ message: 'Le like a ete retire' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const commentPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post non trouve' });

    const newComment = {
      userId: req.user._id,
      text: escapeHtml(req.body.text.trim())
    };

    post.comments.push(newComment);
    await post.save();
    clearCacheByPrefix('timeline:');

    const savedComment = post.comments[post.comments.length - 1];

    createNotification({
      recipient: post.userId,
      sender: req.user._id,
      type: 'comment',
      post: post._id,
      content: req.body.text
    });

    res.json({ message: 'Commentaire ajoute', comment: savedComment });
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
