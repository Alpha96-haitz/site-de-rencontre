import express from 'express';
import { createPost, deletePost, likePost, getUserPosts, getTimelinePosts, commentPost, updatePost, getPostById } from '../controllers/postController.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { postValidation, commentValidation, handleValidation, idValidation } from '../middleware/validation.js';

const router = express.Router();

// Créer un post
router.post(
  '/',
  protect,
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'images', maxCount: 4 }
  ]),
  postValidation,
  handleValidation,
  createPost
);

// Récupérer le feed de l'utilisateur (Timeline)
router.get('/timeline', protect, getTimelinePosts);

// Récupérer les posts d'un utilisateur
router.get('/profile/:userId', protect, idValidation('userId'), handleValidation, getUserPosts);

// Récupérer un post spécifique
router.get('/:id', protect, idValidation('id'), handleValidation, getPostById);

// Liker/Disliker un post
router.put('/:id/like', protect, idValidation('id'), handleValidation, likePost);

// Commenter un post
router.post('/:id/comment', protect, idValidation('id'), commentValidation, handleValidation, commentPost);

// Modifier un post
router.put('/:id', protect, idValidation('id'), postValidation, handleValidation, updatePost);

// Supprimer un post
router.delete('/:id', protect, idValidation('id'), handleValidation, deletePost);

export default router;
