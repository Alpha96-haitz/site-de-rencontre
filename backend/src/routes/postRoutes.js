import express from 'express';
import { createPost, deletePost, likePost, getUserPosts, getTimelinePosts, commentPost } from '../controllers/postController.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Créer un post
router.post('/', protect, upload.single('image'), createPost);

// Récupérer le feed de l'utilisateur (Timeline)
router.get('/timeline', protect, getTimelinePosts);

// Récupérer les posts d'un utilisateur
router.get('/profile/:userId', protect, getUserPosts);

// Liker/Disliker un post
router.put('/:id/like', protect, likePost);

// Commenter un post
router.post('/:id/comment', protect, commentPost);

// Supprimer un post
router.delete('/:id', protect, deletePost);

export default router;
