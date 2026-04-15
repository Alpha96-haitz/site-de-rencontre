import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiChevronLeft, FiAlertCircle } from 'react-icons/fi';
import client from '../api/client';
import PostItem from '../components/PostItem';
import toast from 'react-hot-toast';

export default function PostDetail() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      setError(false);
      try {
        const { data } = await client.get(`/posts/${postId}`);
        setPost(data);
      } catch (err) {
        console.error('Erreur chargement post:', err);
        setError(true);
        toast.error("Impossible de charger la publication");
      } finally {
        setLoading(false);
      }
    };

    if (postId) fetchPost();
  }, [postId]);

  return (
    <div className="max-w-2xl mx-auto py-6 md:py-8 px-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 hover:bg-white rounded-full transition-all text-slate-600 shadow-sm border border-slate-100"
        >
          <FiChevronLeft className="text-xl" />
        </button>
        <h1 className="text-xl font-black text-slate-900 tracking-tight">Publication</h1>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 animate-pulse">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-full bg-slate-100" />
            <div className="space-y-2">
              <div className="h-3 w-32 bg-slate-100 rounded" />
              <div className="h-2 w-20 bg-slate-100 rounded" />
            </div>
          </div>
          <div className="h-4 w-full bg-slate-100 rounded mb-2" />
          <div className="h-4 w-4/5 bg-slate-100 rounded mb-4" />
          <div className="h-64 bg-slate-50 rounded-2xl" />
        </div>
      ) : error ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-sm">
          <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100">
            <FiAlertCircle className="text-2xl text-rose-500" />
          </div>
          <h2 className="text-lg font-bold text-slate-800 mb-2">Publication introuvable</h2>
          <p className="text-slate-500 text-sm mb-6">Elle a peut-être été supprimée par son auteur.</p>
          <button 
            onClick={() => navigate('/home')}
            className="px-6 py-2 bg-pink-600 text-white rounded-xl font-bold hover:bg-pink-700 transition-colors shadow-lg shadow-pink-100"
          >
            Retour à l'accueil
          </button>
        </div>
      ) : post && (
        <PostItem 
          post={post} 
          onDelete={() => navigate('/home')}
          onUpdate={(updated) => setPost(updated)} 
          showFollowAction
        />
      )}
    </div>
  );
}
