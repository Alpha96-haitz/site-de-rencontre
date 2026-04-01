import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiUsers, FiHeart, FiSettings, FiImage, FiUserPlus, FiCheck, FiUser } from 'react-icons/fi';
import toast from 'react-hot-toast';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import PostForm from '../components/PostForm';
import PostItem from '../components/PostItem';

export default function Home() {
  const { user, refreshUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);

  const fetchTimeline = async () => {
    try {
      const { data } = await client.get('/posts/timeline');
      setPosts(data);
    } catch (err) {
      toast.error('Erreur lors du chargement du fil d\'actualité');
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const { data } = await client.get('/users/suggestions');
      // On prend les 5 premières suggestions
      setSuggestions(data.slice(0, 5));
    } catch (err) {
      console.error("Erreur suggestions:", err);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
    fetchSuggestions();
  }, []);

  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts]);
  };

  const handlePostDeleted = (postId) => {
    setPosts(posts.filter(p => p._id !== postId));
  };

  const handleFollow = async (suggestedId) => {
    try {
      await client.put(`/users/${suggestedId}/follow`);
      toast.success("Abonné !");
      refreshUser();
      // On retire la suggestion de la liste locale
      setSuggestions(suggestions.filter(s => s._id !== suggestedId));
      // Optionnel: rafraîchir le feed pour voir ses posts
      fetchTimeline();
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur lors de l'abonnement");
    }
  };

  const primaryPhoto = user?.photos?.find((p) => p.isPrimary) || user?.photos?.[0];
  const avatarUrl = primaryPhoto?.url || user?.googlePhoto || 'https://placehold.co/150';

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-8 flex flex-col md:flex-row gap-6">
      
      {/* Sidebar Gauche */}
      <div className="hidden md:block w-3/12 shrink-0">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sticky top-24">
          <div className="flex flex-col items-center mb-6">
            <Link to={`/profile/${user?.username}`} className="relative group mb-3">
              <img src={avatarUrl} alt="Profil" className="w-24 h-24 rounded-full object-cover border-4 border-slate-50 group-hover:border-pink-50 transition-colors" />
            </Link>
            <Link to={`/profile/${user?.username}`}>
              <h2 className="text-xl font-bold text-slate-800 hover:text-pink-600 transition-colors">
                {user?.firstName} {user?.lastName}
              </h2>
            </Link>
            <p className="text-sm text-slate-500 mt-1">@{user?.username}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-center border-t border-b border-slate-100 py-4 mb-4">
            <div>
              <div className="text-lg font-bold text-slate-800">{user?.followers?.length || 0}</div>
              <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Abonnés</div>
            </div>
            <div>
              <div className="text-lg font-bold text-slate-800">{user?.following?.length || 0}</div>
              <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Abonnements</div>
            </div>
          </div>

          <nav className="space-y-1">
            <Link to={`/home/profile/${user?.username}`} className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors font-medium">
              <FiUser className="w-5 h-5 text-pink-500" /> Mon Profil
            </Link>
            <Link to="/home/matches" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors font-medium">
              <FiHeart className="w-5 h-5 text-rose-500" /> Mes Matchs
            </Link>
            <div className="pt-2 mt-2 border-t border-slate-50">
              <div className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Communauté</div>
              <Link to={`/home/profile/${user?.username}?tab=following`} className="flex items-center justify-between px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors font-medium group">
                <span className="flex items-center gap-3"><FiUserPlus className="w-5 h-5" /> Abonnements</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded-md text-[10px] group-hover:bg-white">{user?.following?.length || 0}</span>
              </Link>
              <Link to={`/home/profile/${user?.username}?tab=followers`} className="flex items-center justify-between px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors font-medium group">
                <span className="flex items-center gap-3"><FiUsers className="w-5 h-5" /> Abonnés</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded-md text-[10px] group-hover:bg-white">{user?.followers?.length || 0}</span>
              </Link>
            </div>
            <Link to="/home/profile/edit" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors font-medium mt-2">
              <FiSettings className="w-5 h-5" /> Paramètres
            </Link>
          </nav>
        </div>
      </div>

      {/* Feed Central */}
      <div className="flex-1 max-w-2xl">
        <PostForm onPostCreated={handlePostCreated} />

        {loading ? (
          <div className="flex justify-center p-8">
            <div className="w-8 h-8 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 text-center text-slate-500">
            <FiImage className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <h3 className="text-lg font-semibold text-slate-700 mb-1">Aucune publication</h3>
            <p>Abonnez-vous à d'autres utilisateurs ou publiez quelque chose pour commencer !</p>
          </div>
        ) : (
          <div className="space-y-0">
            {posts.map(post => (
              <PostItem key={post._id} post={post} onDelete={handlePostDeleted} />
            ))}
          </div>
        )}
      </div>

      {/* Sidebar Droite (Suggestions) */}
      <div className="hidden lg:block w-3/12 shrink-0">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sticky top-24">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center justify-between">
            Suggestions pour vous
            <Link to="/discover" className="text-xs text-pink-600 font-bold hover:underline">Voir tout</Link>
          </h3>
          
          <div className="space-y-4">
            {loadingSuggestions ? (
              <div className="py-4 flex justify-center"><div className="w-6 h-6 border-2 border-pink-200 border-t-pink-500 rounded-full animate-spin"></div></div>
            ) : suggestions.length > 0 ? (
              suggestions.map(s => {
                const sPhoto = s.photos?.find(p => p.isPrimary)?.url || s.googlePhoto || 'https://placehold.co/150';
                return (
                  <div key={s._id} className="flex items-center justify-between gap-3">
                    <Link to={`/profile/${s.username}`} className="flex items-center gap-3 flex-1 min-w-0">
                      <img src={sPhoto} alt={s.firstName} className="w-10 h-10 rounded-full object-cover border border-slate-100" />
                      <div className="truncate">
                        <p className="text-sm font-bold text-slate-800 truncate">{s.firstName} {s.lastName}</p>
                        <p className="text-xs text-slate-500">@{s.username}</p>
                      </div>
                    </Link>
                    <button 
                      onClick={() => handleFollow(s._id)}
                      className="p-2 bg-pink-50 text-pink-600 rounded-full hover:bg-pink-600 hover:text-white transition-all group shadow-sm shadow-pink-100"
                      title="S'abonner"
                    >
                      <FiUserPlus className="w-4 h-4 group-active:scale-125 transition-transform" />
                    </button>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-slate-500">Aucune suggestion pour le moment.</p>
            )}
          </div>
          
          <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-4 mt-8 border border-pink-100 shadow-inner">
            <h4 className="font-bold text-pink-800 text-sm mb-1">Passer au Premium ?</h4>
            <p className="text-[11px] text-pink-600/80 mb-3 leading-relaxed">Multipliez vos rencontres et boostez votre visibilité sur HAITZ-RENCONTRE.</p>
            <button className="w-full py-2 bg-white text-pink-600 rounded-xl text-xs font-bold hover:shadow-lg transition-shadow border border-pink-200">
              En savoir plus
            </button>
          </div>
        </div>
      </div>
      
    </div>
  );
}
