import Post from '../models/Post.js';
import User from '../models/User.js';
import cloudinary from '../config/cloudinary.js';
import { createNotification } from './notificationController.js';

// Créer un post
export const createPost = async (req, res) => {
  try {
    let imageUrl = '';
    
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'posts' },
          (err, res) => err ? reject(err) : resolve(res)
        );
        stream.end(req.file.buffer);
      });
      imageUrl = result.secure_url;
    }

    const newPost = new Post({ 
      ...req.body, 
      userId: req.user._id,
      image: imageUrl || req.body.image 
    });

    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (err) {
    res.status(500).json({ message: err.message });
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
      text: req.body.text
    };

    await post.updateOne({ $push: { comments: newComment } });

    // Notification
    createNotification({
      recipient: post.userId,
      sender: req.user._id,
      type: 'comment',
      post: post._id,
      content: req.body.text
    });

    res.json({ message: "Commentaire ajouté", comment: newComment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Supprimer un post
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post non trouvé" });
    if (post.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Action non autorisée" });
    }
    await post.deleteOne();
    res.json({ message: "Post supprimé" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
