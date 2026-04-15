import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiUsers, FiHeart, FiSettings, FiImage, FiUserPlus, FiCheck, FiUser } from 'react-icons/fi';
import toast from 'react-hot-toast';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../socket/client';
import PostForm from '../components/PostForm';
import PostItem from '../components/PostItem';
import debounce from 'lodash.debounce';

export default function Home() {
  const { user, refreshUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showMoreSuggestions, setShowMoreSuggestions] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const fetchTimeline = useCallback(async (pageNum = 1, shouldAppend = false) => {
    if (pageNum === 1) setLoading(true);
    else setIsFetchingMore(true);

    try {
      const { data } = await client.get(`/posts/timeline?limit=10&page=${pageNum}`);
      if (data.length < 10) setHasMore(false);
      else setHasMore(true);
      
      setPosts((prev) => shouldAppend ? [...prev, ...data] : data);
    } catch (err) {
      toast.error('Erreur lors du chargement du fil d\'actualité');
    } finally {
      setLoading(false);
      setIsFetchingMore(false);
    }
  }, []);

  const fetchSuggestions = useCallback(async (limit = 5) => {
    setLoadingSuggestions(true);
    try {
      const { data } = await client.get(`/users/suggestions?limit=${limit}`);
      setSuggestions(data);
    } catch (err) {
      console.error("Erreur suggestions:", err);
    } finally {
      setLoadingSuggestions(false);
    }
  }, []);

  useEffect(() => {
    fetchTimeline(1, false);
    fetchSuggestions();
  }, [fetchTimeline, fetchSuggestions]);

  useEffect(() => {
    const handleScroll = debounce(() => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 800) {
        if (!loading && !isFetchingMore && hasMore) {
          setPage((p) => {
            const next = p + 1;
            fetchTimeline(next, true);
            return next;
          });
        }
      }
    }, 150);

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, isFetchingMore, hasMore, fetchTimeline]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleOnline = ({ userId }) => {
      if (!userId) return;
      setSuggestions((prev) => prev.map((s) => (s._id === userId ? { ...s, isOnline: true } : s)));
    };

    const handleOffline = ({ userId }) => {
      if (!userId) return;
      setSuggestions((prev) => prev.map((s) => (s._id === userId ? { ...s, isOnline: false } : s)));
    };

    const handleNewPost = (newPost) => {
      if (!newPost?._id) return;
      setPosts((prev) => {
        if (prev.some(p => p._id === newPost._id)) return prev;
        return [newPost, ...prev];
      });
    };

    socket.on('user:online', handleOnline);
    socket.on('user:offline', handleOffline);
    socket.on('post:new', handleNewPost);

    return () => {
      socket.off('user:online', handleOnline);
      socket.off('user:offline', handleOffline);
      socket.off('post:new', handleNewPost);
    };
  }, []);

  const handlePostCreated = useCallback((newPost) => {
    setPosts((prev) => [newPost, ...prev]);
  }, []);

  const handlePostDeleted = useCallback((postId) => {
    setPosts((prev) => prev.filter((p) => p._id !== postId));
  }, []);

  const handlePostUpdated = useCallback((updatedPost) => {
    setPosts((prev) => prev.map((p) => (p._id === updatedPost._id ? updatedPost : p)));
  }, []);

  const handleFollow = useCallback(async (suggestedId) => {
    try {
      await client.put(`/users/${suggestedId}/follow`);
      toast.success("Abonné !");
      refreshUser().catch(() => {});
      setSuggestions((prev) => prev.filter((s) => s._id !== suggestedId));
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur lors de l'abonnement");
    }
  }, [refreshUser]);

  const handleToggleMoreSuggestions = useCallback(async () => {
    const next = !showMoreSuggestions;
    setShowMoreSuggestions(next);
    await fetchSuggestions(next ? 30 : 5);
  }, [showMoreSuggestions, fetchSuggestions]);

  const primaryPhoto = user?.photos?.find((p) => p.isPrimary) || user?.photos?.[0];
  const avatarUrl = primaryPhoto?.url || user?.googlePhoto || 'https://placehold.co/150';

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-8 flex flex-col md:flex-row gap-6">
      
      {/* Sidebar Gauche */}
      <div className="hidden md:block w-3/12 shrink-0">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sticky top-24">
          <div className="flex flex-col items-center mb-6">
            <Link to={`/home/profile/${user?.username}`} className="relative group mb-3">
              <img src={avatarUrl} alt="Profil" className="w-24 h-24 rounded-full object-cover border-4 border-slate-50 group-hover:border-pink-50 transition-colors" />
            </Link>
            <Link to={`/home/profile/${user?.username}`}>
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
            <div className="mt-4 p-4 bg-slate-50 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center shadow-sm">
                  <FiSettings className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Paramètres du compte</p>
                  <p className="text-xs text-slate-500">Choisissez une option et ouvrez les paramètres.</p>
                </div>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => setShowSettingsMenu((prev) => !prev)}
                  className="w-full rounded-2xl px-3 py-3 bg-white border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors flex items-center justify-between"
                >
                  <span>{showSettingsMenu ? 'Cacher les options' : 'Afficher les options'}</span>
                  <span className={`text-sm font-black transition-transform ${showSettingsMenu ? 'rotate-180' : ''}`}>&#9660;</span>
                </button>
                {showSettingsMenu && (
                  <div className="space-y-2">
                    <Link to="/home/profile/edit?tab=general" className="block rounded-2xl px-3 py-3 bg-white border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors">
                      Modifier le profil
                    </Link>
                    <Link to="/home/profile/edit?tab=security" className="block rounded-2xl px-3 py-3 bg-white border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors">
                      Confidentialité et sécurité
                    </Link>
                    <Link to="/home/profile/edit?tab=notifications" className="block rounded-2xl px-3 py-3 bg-white border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors">
                      Notifications
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </nav>
        </div>
      </div>

      {/* Feed Central */}
      <div className="flex-1 max-w-2xl">
        <PostForm onPostCreated={handlePostCreated} />

        {loading ? (
          <div className="space-y-4 p-2">
            {[1, 2, 3].map((k) => (
              <div key={k} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-slate-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-1/3 bg-slate-200 rounded" />
                    <div className="h-2 w-1/4 bg-slate-200 rounded" />
                  </div>
                </div>
                <div className="h-3 w-full bg-slate-200 rounded mb-2" />
                <div className="h-3 w-5/6 bg-slate-200 rounded mb-4" />
                <div className="h-48 bg-slate-200 rounded-xl" />
              </div>
            ))}
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
              <PostItem key={post._id} post={post} onDelete={handlePostDeleted} onUpdate={handlePostUpdated} showFollowAction />
            ))}
            {hasMore ? (
              <div className="py-12 flex flex-col items-center gap-2">
                 <div className="w-8 h-8 border-4 border-pink-100 border-t-pink-500 rounded-full animate-spin"></div>
                 <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Chargement...</p>
              </div>
            ) : posts.length > 0 && (
              <p className="py-16 text-center text-slate-400 italic text-sm">Vous avez vu toutes les publications du jour !</p>
            )}
          </div>
        )}
      </div>

      {/* Sidebar Droite (Suggestions) */}
      <div className="hidden lg:block w-3/12 shrink-0">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sticky top-24">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center justify-between">
            Suggestions pour vous
            <button onClick={handleToggleMoreSuggestions} className="text-xs text-pink-600 font-bold hover:underline">
              {showMoreSuggestions ? 'Voir moins' : 'Voir plus'}
            </button>
          </h3>
          
          <div className="space-y-4">
            {loadingSuggestions ? (
              <div className="py-4 flex justify-center"><div className="w-6 h-6 border-2 border-pink-200 border-t-pink-500 rounded-full animate-spin"></div></div>
            ) : suggestions.length > 0 ? (
              suggestions.map(s => {
                const sPhoto = s.photos?.find(p => p.isPrimary)?.url || s.googlePhoto || 'https://placehold.co/150';
                return (
                  <div key={s._id} className="flex items-center justify-between gap-3">
                    <Link to={`/home/profile/${s.username}`} className="flex items-center gap-3 flex-1 min-w-0">
                      <img src={sPhoto} alt={s.firstName} className="w-10 h-10 rounded-full object-cover border border-slate-100" />
                      <div className="truncate">
                        <p className="text-sm font-bold text-slate-800 truncate">{s.firstName} {s.lastName}</p>
                        <div className="flex items-center gap-1">
                           <div className={`w-2 h-2 rounded-full ${s.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                           <p className={`text-[10px] font-black uppercase tracking-widest ${s.isOnline ? 'text-emerald-500' : 'text-slate-400'}`}>
                              {s.isOnline ? 'en ligne' : 'hors ligne'}
                           </p>
                        </div>
                      </div>
                    </Link>
                    <button 
                      onClick={() => handleFollow(s._id)}
                      className="p-2 bg-pink-50 text-pink-600 rounded-full hover:bg-pink-600 hover:text-white transition-all group shadow-sm shadow-pink-100"
                    >
                      <FiUserPlus className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-slate-500">Aucune suggestion.</p>
            )}
          </div>
          
          <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-4 mt-8 border border-pink-100 shadow-inner">
            <h4 className="font-bold text-pink-800 text-sm mb-1">Passer au Premium ?</h4>
            <p className="text-[11px] text-pink-600/80 mb-3 leading-relaxed">Multipliez vos rencontres et boostez votre visibilité sur HAITZ.</p>
            <button className="w-full py-2 bg-white text-pink-600 rounded-xl text-xs font-bold hover:shadow-lg transition-shadow border border-pink-200">
              En savoir plus
            </button>
          </div>
        </div>
      </div>
      
    </div>
  );
}
