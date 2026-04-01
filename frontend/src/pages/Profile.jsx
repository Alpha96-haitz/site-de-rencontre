import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import toast from 'react-hot-toast';
import PostItem from '../components/PostItem';
import { FiEdit2, FiUserPlus, FiCheck } from 'react-icons/fi';

export default function Profile() {
  const { username } = useParams();
  const { user, refreshUser } = useAuth();
  
  // Déterminer s'il s'agit du propre profil de l'utilisateur connecté
  const isOwnProfile = !username || username === user?.username || username === user?._id;

  // Initialisation avec l'utilisateur local si c'est son propre profil pour éviter le flash de chargement
  const [profile, setProfile] = useState(isOwnProfile ? user : null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(!isOwnProfile); // Pas de chargement si on a déjà les données locales

  useEffect(() => {
    refreshUser().catch(() => {});
  }, [refreshUser]);

  useEffect(() => {
    const fetchProfileData = async () => {
      // Si ce n'est pas notre profil ou si on a besoin d'une mise à jour fraîche
      if (!isOwnProfile) setLoading(true);
      
      try {
        let profileData;
        if (!isOwnProfile) {
          const { data } = await client.get(`/users/${username}`);
          profileData = data;
        } else {
          profileData = user;
        }
        
        setProfile(profileData);

        if (profileData?._id) {
          const { data: postsData } = await client.get(`/posts/profile/${profileData._id}`);
          setPosts(postsData);
        }
      } catch (err) {
        if (!isOwnProfile) toast.error('Erreur lors du chargement du profil');
        setProfile(isOwnProfile ? user : null);
      } finally {
        setLoading(false);
      }
    };

    if (user?._id) {
      fetchProfileData();
    }
  }, [username, user?._id, isOwnProfile]);

  const data = profile;
  
  const handleFollowToggle = async () => {
    if (!data) return;
    try {
      if (user?.following?.includes(data._id)) {
        await client.put(`/users/${data._id}/unfollow`);
        toast.success("Vous n'êtes plus abonné");
      } else {
        await client.put(`/users/${data._id}/follow`);
        toast.success("Vous êtes maintenant abonné");
      }
      refreshUser();
      
      setProfile(prev => {
        if (!prev) return prev;
        const isCurrentlyFollowing = user?.following?.includes(prev._id);
        const newFollowers = isCurrentlyFollowing 
          ? prev.followers.filter(id => id !== user._id)
          : [...(prev.followers || []), user._id];
        return { ...prev, followers: newFollowers };
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    }
  };

  if (loading && !data) {
    return (
      <div className="flex justify-center p-12">
        <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data) {
    return <div className="text-center p-12 text-slate-500 font-medium">Profil introuvable</div>;
  }

  const primaryPhoto = data.photos?.find((p) => p.isPrimary) || data.photos?.[0];
  const avatarUrl = primaryPhoto?.url || data.googlePhoto || 'https://placehold.co/150';
  const coverUrl = data.coverPicture || 'https://placehold.co/800x300?text=Couverture';
  
  const isFollowing = user?.following?.includes(data._id);

  return (
    <div className="max-w-4xl mx-auto pb-8 animate-in fade-in duration-500">
      {/* En-tête Profil (Cover + Info) */}
      <div className="bg-white rounded-b-3xl shadow-sm border border-slate-100 overflow-hidden mb-6">
        {/* Cover Photo */}
        <div className="h-48 md:h-72 w-full bg-slate-200 relative group">
          <img src={coverUrl} alt="Cover" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        </div>

        {/* Profil Infos */}
        <div className="px-6 pb-8 relative">
          <div className="flex flex-col md:flex-row md:items-end justify-between -mt-20 md:-mt-24 sm:gap-4 relative z-10 block mb-6">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-5">
              <div className="relative group">
                <img 
                  src={avatarUrl} 
                  alt="Avatar" 
                  className="w-36 h-36 md:w-44 md:h-44 rounded-full object-cover border-8 border-white shadow-xl bg-white"
                />
                {data.isOnline && (
                  <div className="absolute bottom-4 right-4 w-6 h-6 bg-green-500 border-4 border-white rounded-full"></div>
                )}
              </div>
              <div className="text-center md:text-left md:mb-4">
                <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">
                  {data.firstName} {data.lastName}
                  {data.age != null && <span className="text-slate-400 font-light ml-2">{data.age}</span>}
                </h1>
                <p className="text-pink-600 font-bold text-lg">@{data.username}</p>
                <div className="flex gap-6 mt-3 text-sm font-bold text-slate-500 justify-center md:justify-start">
                  <span className="flex flex-col items-center md:items-start">
                    <span className="text-slate-800 text-lg uppercase tracking-tighter">{data.followers?.length || 0}</span>
                    <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Abonnés</span>
                  </span>
                  <span className="flex flex-col items-center md:items-start">
                    <span className="text-slate-800 text-lg uppercase tracking-tighter">{data.following?.length || 0}</span>
                    <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Abonnements</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 md:mt-0 md:mb-4 flex justify-center">
              {isOwnProfile ? (
                <Link to="/home/profile/edit" className="flex items-center gap-2 bg-slate-900 text-white hover:bg-slate-800 px-8 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-slate-200 active:scale-95">
                  <FiEdit2 className="w-4 h-4" /> Modifier le profil
                </Link>
              ) : (
                <button 
                  onClick={handleFollowToggle}
                  className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-black transition-all shadow-lg active:scale-95 ${
                    isFollowing 
                      ? 'bg-slate-100 text-slate-800 hover:bg-slate-200 shadow-slate-100'
                      : 'bg-pink-600 text-white hover:bg-pink-700 shadow-pink-100'
                  }`}
                >
                  {isFollowing ? <><FiCheck /> Abonné(e)</> : <><FiUserPlus /> S'abonner</>}
                </button>
              )}
            </div>
          </div>

          {/* Bio & Intérêts */}
          <div className="mt-4 text-center md:text-left bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
            <h3 className="text-xs uppercase font-black tracking-[0.2em] text-slate-400 mb-2">Bio</h3>
            <p className="text-slate-700 text-lg leading-relaxed">{data.bio || 'Aucune description fournie.'}</p>
            {data.interests?.length > 0 && (
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-6">
                {data.interests.map((interest) => (
                  <span key={interest} className="px-4 py-1.5 bg-white border border-slate-100 text-slate-600 rounded-xl text-xs font-black shadow-sm uppercase tracking-wide">
                    {interest}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Publications */}
      <div className="max-w-2xl mx-auto px-4 sm:px-0">
        <div className="flex items-center justify-between mb-6 px-2">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Publications</h2>
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{posts.length} Posts</span>
        </div>
        
        {posts.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-12 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiEdit2 className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-slate-500 font-bold">Cet utilisateur n'a rien publié pour le moment.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map(post => (
              <PostItem key={post._id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
