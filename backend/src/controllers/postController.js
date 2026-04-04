import Post from '../models/Post.js';
import cloudinary from '../config/cloudinary.js';
import { createNotification } from './notificationController.js';

const escapeHtml = (str) => String(str || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

// Créer un post
export const createPost = async (req, res) => {
  try {
    let imageUrl = '';
    
    if (req.file) {
      imageUrl = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Cloudinary upload timeout (60s)"));
        }, 60000);

        const b64 = Buffer.from(req.file.buffer).toString('base64');
        const dataURI = "data:" + req.file.mimetype + ";base64," + b64;
        
        cloudinary.uploader.upload(dataURI, { folder: 'posts' }, (uploadErr, uploadRes) => {
          clearTimeout(timeout);
          if (uploadErr) {
            console.error("Cloudinary Post Upload Error:", uploadErr);
            return reject(uploadErr);
          }
          resolve(uploadRes.secure_url);
        });
      });
    }

    const postData = { ...req.body };
    if (typeof postData.image === 'object') delete postData.image;

    const newPost = new Post({ 
      ...postData, 
      userId: req.user._id,
      image: imageUrl || (typeof req.body.image === 'string' ? req.body.image : '')
    });

    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (err) {
    console.error("Post Creation Error Details:", err);
    res.status(500).json({ message: err.message, stack: err.stack });
  }
};

// Récupérer le fil global (Toutes les publications communautaires)
export const getTimelinePosts = async (req, res) => {
  try {
    const allPosts = await Post.find().sort({ createdAt: -1 });
    res.json(allPosts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Récupérer les posts d'un utilisateur spécifique (profil)
export const getUserPosts = async (req, res) => {
  try {
    const posts = await Post.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Liker / Disliker un post
export const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post non trouvé" });

    if (!post.likes.includes(req.user._id)) {
      await post.updateOne({ $push: { likes: req.user._id } });
      
      // Notification
      createNotification({
        recipient: post.userId,
        sender: req.user._id,
        type: 'like',
        post: post._id
      });

      res.json({ message: "Le post a été liké" });
    } else {
      await post.updateOne({ $pull: { likes: req.user._id } });
      res.json({ message: "Le like a été retiré" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Commenter un post
export const commentPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post non trouvé" });

    const newComment = {
      userId: req.user._id,
      text: escapeHtml(req.body.text.trim())
    };

    post.comments.push(newComment);
    await post.save();
    
    // Récupérer le dernier commentaire ajouté (celui avec l'_id et createdAt générés)
    const savedComment = post.comments[post.comments.length - 1];

    // Notification
    createNotification({
      recipient: post.userId,
      sender: req.user._id,
      type: 'comment',
      post: post._id,
      content: req.body.text
    });

    res.json({ message: "Commentaire ajouté", comment: savedComment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Supprimer un post
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post non trouvé" });
    if (post.userId.toString() !== req.user._id.toString() && req.user.role !== 'root') {
      return res.status(403).json({ message: "Action non autorisée" });
    }
    await post.deleteOne();
    res.json({ message: "Post supprimé" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
