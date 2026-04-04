import { memo, useState, useEffect } from 'react';
import { FiHeart, FiMessageCircle, FiTrash2, FiMoreHorizontal } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

function PostItem({ post: initialPost, onDelete, showFollowAction = false }) {
  const { user, refreshUser } = useAuth();
  const [post, setPost] = useState(initialPost);
  const [author, setAuthor] = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [loadingComment, setLoadingComment] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followSuccess, setFollowSuccess] = useState(false);
  const [followedLocally, setFollowedLocally] = useState(false);


  useEffect(() => {
    setPost(initialPost);
  }, [initialPost]);
  useEffect(() => {
    // Récupérer les infos de l'auteur
    if (post.userId) {
      if (typeof post.userId === 'object' && post.userId.username) {
        setAuthor(post.userId);
      } else {
        client.get(`/users/${post.userId}`)
          .then(r => setAuthor(r.data))
          .catch(() => {});
      }
    }
  }, [post.userId]);

  const getSafeId = (value) => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
      if (typeof value._id === 'string') return value._id;
      if (typeof value.id === 'string') return value.id;
    }
    return '';
  };

  const authorId = getSafeId(author) || getSafeId(post.userId);
  const currentUserId = getSafeId(user);
  const isOwner = currentUserId && currentUserId === authorId;
  const canDelete = isOwner || user?.role === 'root';
  const hasLiked = post.likes?.includes(user?._id);
  const isFollowing = (user?.following || []).some((f) => getSafeId(f) === authorId);
  const showFollowButton = showFollowAction && Boolean(authorId) && !isOwner && !isFollowing && !followedLocally;

  const toggleLike = async () => {
    try {
      await client.put(`/posts/${post._id}/like`);
      setPost(prev => {
        const likes = prev.likes.includes(user._id)
          ? prev.likes.filter(id => id !== user._id)
          : [...prev.likes, user._id];
        return { ...prev, likes };
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setLoadingComment(true);
    try {
      const { data } = await client.post(`/posts/${post._id}/comment`, { text: commentText });
      setPost(prev => ({ ...prev, comments: [...prev.comments, data.comment] }));
      setCommentText('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingComment(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Supprimer cette publication ?")) return;
    try {
      await client.delete(`/posts/${post._id}`);
      toast.success("Publication supprimée");
      if (onDelete) onDelete(post._id);
    } catch (err) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleFollowAuthor = async () => {
    if (!authorId || followLoading) return;
    setFollowLoading(true);
    try {
      await client.put(`/users/${authorId}/follow`);
      setFollowSuccess(true);
      refreshUser().catch(() => {});
      toast.success('Abonne !');
      setTimeout(() => {
        setFollowedLocally(true);
        setFollowSuccess(false);
      }, 1000);
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur lors de l'abonnement");
    } finally {
      setFollowLoading(false);
    }
  };

  const authorPhoto = author?.photos?.find(p => p.isPrimary)?.url || author?.googlePhoto || 'https://placehold.co/150';

  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-4 transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Link to={`/home/profile/${author?.username || author?._id}`} className="relative">
            <img src={authorPhoto} alt="Author" loading="lazy" decoding="async" className="w-11 h-11 rounded-full object-cover border border-slate-100" />
            {author?.isOnline && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>}
          </Link>
          <div>
            <Link to={`/home/profile/${author?.username || author?._id}`} className="font-bold text-slate-800 hover:text-pink-600 transition-colors">
              {author?.firstName} {author?.lastName}
            </Link>
            <p className="text-[11px] font-medium text-slate-400 flex items-center gap-1 uppercase tracking-wider">
              {post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: fr }) : "À l'instant"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {showFollowButton && (
            <button
              onClick={handleFollowAuthor}
              disabled={followLoading}
              className={`px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider border transition-all disabled:opacity-60 ${
                followSuccess
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                  : 'bg-pink-50 text-pink-600 border-pink-100 hover:bg-pink-100'
              }`}
            >
              {followLoading ? '...' : followSuccess ? 'Suivi' : 'Suivre'}
            </button>
          )}
          {canDelete && (
            <div className="relative">
              <button
                onClick={() => setShowOptions(!showOptions)}
                className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors"
              >
                <FiMoreHorizontal className="w-5 h-5" />
              </button>
              {showOptions && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowOptions(false)}></div>
                  <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-xl border border-slate-100 z-20 py-1 overflow-hidden">
                    <button
                      onClick={() => { setShowOptions(false); handleDelete(); }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 font-medium transition-colors"
                    >
                      <FiTrash2 className="w-4 h-4" /> Supprimer
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mb-4">
        <p className="text-slate-700 text-[15px] leading-relaxed whitespace-pre-wrap">{post.desc}</p>
        {post.image && (
          <div className="mt-3 rounded-2xl overflow-hidden border border-slate-100 shadow-inner bg-slate-50">
            <img src={post.image} alt="Post content" loading="lazy" decoding="async" className="max-h-[500px] w-full object-contain mx-auto" />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-widest mb-4 px-1">
        <span className="flex items-center gap-1.5">
          <div className="flex -space-x-1">
            <div className="w-5 h-5 rounded-full bg-pink-500 flex items-center justify-center border border-white"><FiHeart className="w-2.5 h-2.5 text-white fill-current" /></div>
          </div>
          {post.likes?.length || 0} J'aime
        </span>
        <button onClick={() => setShowComments(!showComments)} className="hover:text-pink-500 transition-colors">
          {post.comments?.length || 0} Commentaires
        </button>
      </div>

      <div className="flex items-center gap-2 border-t border-slate-50 pt-2">
        <button 
          onClick={toggleLike}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all font-bold text-sm ${
            hasLiked ? 'text-pink-600 bg-pink-50' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <FiHeart className={`w-5 h-5 ${hasLiked ? 'fill-current' : ''}`} />
          J'aime
        </button>
        <button 
          onClick={() => setShowComments(!showComments)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 text-slate-500 rounded-xl hover:bg-slate-50 transition-all font-bold text-sm"
        >
          <FiMessageCircle className="w-5 h-5" />
          Commenter
        </button>
      </div>

      {showComments && (
        <div className="mt-4 pt-4 border-t border-slate-50 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <form onSubmit={handleComment} className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Écrire un commentaire..."
              className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 transition-all"
            />
            <button 
              type="submit" 
              disabled={loadingComment || !commentText.trim()}
              className="bg-pink-500 text-white rounded-xl px-4 text-sm font-bold shadow-sm shadow-pink-100 disabled:opacity-50"
            >
              Envoyer
            </button>
          </form>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
            {post.comments?.length > 0 ? (
              [...post.comments].reverse().map((c, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <div className="bg-slate-50 rounded-2xl px-4 py-2.5 text-sm flex-1 border border-slate-100 shadow-sm">
                    <span className="font-bold text-slate-800 text-xs mb-1 block">Utilisateur</span>
                    <p className="text-slate-600 leading-relaxed">{c.text}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block uppercase font-bold tracking-tighter">
                      {c.createdAt ? formatDistanceToNow(new Date(c.createdAt), { addSuffix: true, locale: fr }) : "À l'instant"}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-xs text-slate-400 py-2">Soyez le premier à commenter !</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(PostItem);

