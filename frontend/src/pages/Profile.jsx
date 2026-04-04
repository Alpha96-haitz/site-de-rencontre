import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import toast from 'react-hot-toast';
import PostItem from '../components/PostItem';
import PostForm from '../components/PostForm';
import ReportModal from '../components/ReportModal';
import { FiEdit2, FiUserPlus, FiCheck, FiHeart, FiMessageCircle, FiMapPin, FiCamera, FiMoreHorizontal, FiPlus, FiBriefcase, FiHome, FiClock, FiGrid, FiUsers, FiImage, FiStar, FiMail, FiFlag, FiShield } from 'react-icons/fi';
import MatchModal from '../components/MatchModal';

export default function Profile() {
  const { username } = useParams();
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  
  const isOwnProfile = !username || username === user?.username || username === user?._id;

  const [profile, setProfile] = useState(isOwnProfile ? user : null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(!isOwnProfile);
  const [activeTab, setActiveTab] = useState('posts'); // 'posts', 'about', 'friends', 'photos'
  const [aboutSection, setAboutSection] = useState('overview'); // overview | personal | interests | account
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [matchData, setMatchData] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [hasMatch, setHasMatch] = useState(false);

  useEffect(() => {
    refreshUser().catch(() => {});
  }, [refreshUser]);

  useEffect(() => {
    if (activeTab !== 'about') {
      setAboutSection('overview');
    }
  }, [activeTab]);

  useEffect(() => {
    const fetchProfileData = async () => {
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

        // Vérifier si un match mutuel existe pour le chat
        if (!isOwnProfile && profileData?._id) {
          const { data: matchCheck } = await client.get(`/matches/status/${profileData._id}`);
          setHasMatch(matchCheck.isMutual);
          setIsLiked(matchCheck.hasLiked);
        }

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

  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts]);
  };

  const handlePostUpdated = (updatedPost) => {
    setPosts((prev) => prev.map((p) => (p._id === updatedPost._id ? updatedPost : p)));
  };

  const handleFollowToggle = async () => {
    if (!profile) return;
    try {
      if (user?.following?.includes(profile._id)) {
        await client.put(`/users/${profile._id}/unfollow`);
      } else {
        await client.put(`/users/${profile._id}/follow`);
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

  const handleLike = async () => {
    if (!profile || isLiked || hasMatch) return;
    try {
      const { data: res } = await client.post(`/matches/like/${profile._id}`);
      setIsLiked(true);
      if (res.isMutual) {
        setHasMatch(true);
        setMatchData(res.match);
        setShowMatchModal(true);
      } else {
        toast.success("Like envoyé ! ❤️");
      }
    } catch (err) {
      toast.error("Erreur lors du like");
    }
  };

  if (loading && !profile) {
    return (
      <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center p-20 text-slate-400 font-black uppercase text-[10px] tracking-widest animate-pulse">
        Chargement du profil...
      </div>
    );
  }

  if (!profile) return <div className="text-center p-20 text-slate-500 font-black uppercase tracking-widest">Profil introuvable</div>;

  const primaryPhoto = profile.photos?.find((p) => p.isPrimary) || profile.photos?.[0];
  const avatarUrl = primaryPhoto?.url || profile.googlePhoto || 'https://placehold.co/150';
  const coverUrl = profile.coverPicture || 'https://placehold.co/1200x400?text=Couverture';
  const isFollowing = user?.following?.includes(profile._id);
  const profileVisibility = profile.privacy?.profileVisibility || 'public';
  const showOnlineStatus = profile.privacy?.showOnlineStatus ?? true;
  const canViewProfile = isOwnProfile || profileVisibility === 'public' || (profileVisibility === 'matches' && hasMatch);
  const profileRestrictedMessage = profileVisibility === 'private'
    ? 'Ce profil est privé. Seul l’utilisateur peut en voir le contenu.'
    : 'Ce profil est réservé aux matchs mutuels.';

  const renderRestrictedProfile = () => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
      <h2 className="text-2xl font-black text-slate-900 mb-3">Profil restreint</h2>
      <p className="text-slate-500 mb-6">{profileRestrictedMessage}</p>
      <div className="flex flex-wrap justify-center gap-3">
        {!isOwnProfile && (
          <>
            <button onClick={handleFollowToggle} className={`px-5 py-3 rounded-xl font-bold transition-all ${isFollowing ? 'bg-slate-100 text-slate-800' : 'bg-pink-600 text-white hover:bg-pink-700'}`}>
              {isFollowing ? 'Abonné' : 'S’abonner'}
            </button>
            <button onClick={() => setShowReportModal(true)} className="px-5 py-3 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold transition-all">
              Signaler
            </button>
          </>
        )}
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'posts':
        if (!canViewProfile) return renderRestrictedProfile();
        return (
          <div className="flex flex-col md:flex-row gap-4">
             {/* LEFT COLUMN (Informations) */}
             <div className="w-full md:w-[380px] shrink-0 space-y-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                   <h2 className="text-xl font-black text-slate-900 mb-4 tracking-tight">Informations</h2>
                   <div className="text-center md:text-left mb-6">
                      <p className="text-[15px] text-slate-700 leading-relaxed mb-4">{profile.bio || "Aucune bio fournie."}</p>
                      <button onClick={() => isOwnProfile && navigate('/home/profile/edit')} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 py-2 rounded-lg font-bold text-sm transition-all mb-4">Modifier la bio</button>
                   </div>
                   <div className="space-y-3">
                      <div className="flex items-center gap-3 text-slate-700 text-[15px]">
                         <FiUsers className="text-xl text-slate-400" />
                         <span>Genre: <strong>{profile.gender || 'Non renseigne'}</strong></span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-700 text-[15px]">
                         <FiMapPin className="text-xl text-slate-400" />
                         <span>Ville: <strong>{profile.location?.city || 'Non renseignee'}</strong></span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-700 text-[15px]">
                         <FiStar className="text-xl text-slate-400" />
                         <span>Age: <strong>{profile.age || 'Non renseigne'}</strong></span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-700 text-[15px]">
                         <FiBriefcase className="text-xl text-slate-400" />
                         <span>Interets: <strong>{profile.interests?.length ? profile.interests.join(', ') : 'Non renseignes'}</strong></span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-700 text-[15px]">
                         <FiClock className="text-xl text-slate-400" />
                         <span>
                           Membre depuis{' '}
                           <strong>{profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : 'Date inconnue'}</strong>
                         </span>
                      </div>
                   </div>
                   <button onClick={() => isOwnProfile && navigate('/home/profile/edit')} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 py-2 rounded-lg font-bold text-sm transition-all mt-6">Modifier les infos</button>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                   <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-black text-slate-900 tracking-tight hover:underline cursor-pointer">Photos</h2>
                      <button onClick={() => setActiveTab('photos')} className="text-pink-600 hover:bg-pink-50 px-2 py-1 rounded text-[15px] font-medium">Toutes les photos</button>
                   </div>
                   <div className="grid grid-cols-3 gap-1.5 rounded-xl overflow-hidden">
                      {profile.photos?.slice(0, 9).map((p, i) => (
                         <img key={i} src={p.url} alt="" className="aspect-square object-cover w-full hover:opacity-90 cursor-pointer transition-opacity" />
                      ))}
                   </div>
                </div>
             </div>

             {/* RIGHT COLUMN (Posts) */}
             <div className="flex-1 space-y-4">
                {isOwnProfile && (
                   <PostForm onPostCreated={handlePostCreated} />
                )}
                {posts.length === 0 ? (
                   <div className="bg-white p-12 text-center rounded-xl shadow-sm border border-slate-200">
                      <FiGrid className="w-16 h-16 text-slate-100 mx-auto mb-4" />
                      <p className="text-slate-400 font-bold text-lg">Aucune publication à afficher.</p>
                   </div>
                ) : (
                   <div className="space-y-4">
                      {posts.map(post => <PostItem key={post._id} post={post} onUpdate={handlePostUpdated} />)}
                   </div>
                )}
             </div>
          </div>
        );
      case 'about':
        if (!canViewProfile) return renderRestrictedProfile();
        return (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-full md:w-80 border-r border-slate-100 p-4 font-bold text-slate-600 bg-slate-50/60">
              <h2 className="text-2xl font-black text-slate-900 mb-6 p-2">A propos</h2>
              <div className="space-y-1">
                {[
                  { id: 'overview', label: 'Vue d ensemble' },
                  { id: 'personal', label: 'Informations personnelles' },
                  { id: 'interests', label: 'Centre d interet' },
                  { id: 'account', label: 'Compte' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setAboutSection(item.id)}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      aboutSection === item.id
                        ? 'bg-white text-pink-600 shadow-sm'
                        : 'hover:bg-white hover:text-pink-600'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 p-8">
              {aboutSection === 'overview' && (
                <div className="space-y-6">
                  <h3 className="text-[17px] font-black text-slate-900">Vue d ensemble</h3>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center gap-3">
                      <FiUsers className="text-slate-500" />
                      <span className="font-semibold text-slate-700">Genre: <strong>{profile.gender || 'Non renseigne'}</strong></span>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center gap-3">
                      <FiMapPin className="text-slate-500" />
                      <span className="font-semibold text-slate-700">Ville: <strong>{profile.location?.city || 'Non renseignee'}</strong></span>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center gap-3">
                      <FiStar className="text-slate-500" />
                      <span className="font-semibold text-slate-700">Age: <strong>{profile.age || 'Non renseigne'}</strong></span>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center gap-3">
                      <FiClock className="text-slate-500" />
                      <span className="font-semibold text-slate-700">Membre depuis: <strong>{profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : 'Date inconnue'}</strong></span>
                    </div>
                  </div>
                </div>
              )}

              {aboutSection === 'personal' && (
                <div className="space-y-6">
                  <h3 className="text-[17px] font-black text-slate-900">Informations personnelles</h3>
                  <div className="bg-white border border-slate-100 rounded-2xl divide-y divide-slate-100">
                    <div className="p-4 flex justify-between items-center"><span className="text-slate-500 font-semibold">Prenom</span><span className="text-slate-900 font-bold">{profile.firstName || '-'}</span></div>
                    <div className="p-4 flex justify-between items-center"><span className="text-slate-500 font-semibold">Nom</span><span className="text-slate-900 font-bold">{profile.lastName || '-'}</span></div>
                    <div className="p-4 flex justify-between items-center"><span className="text-slate-500 font-semibold">Genre</span><span className="text-slate-900 font-bold">{profile.gender || '-'}</span></div>
                    <div className="p-4 flex justify-between items-center"><span className="text-slate-500 font-semibold">Age</span><span className="text-slate-900 font-bold">{profile.age || '-'}</span></div>
                    <div className="p-4 flex justify-between items-center"><span className="text-slate-500 font-semibold">Ville</span><span className="text-slate-900 font-bold">{profile.location?.city || '-'}</span></div>
                  </div>
                </div>
              )}

              {aboutSection === 'interests' && (
                <div className="space-y-6">
                  <h3 className="text-[17px] font-black text-slate-900">Centre d interet</h3>
                  <div className="bg-white border border-slate-100 rounded-2xl p-5">
                    {profile.interests?.length ? (
                      <div className="flex flex-wrap gap-2">
                        {profile.interests.map((interest, idx) => (
                          <span key={`${interest}-${idx}`} className="px-3 py-1.5 rounded-full bg-pink-50 text-pink-700 text-sm font-bold border border-pink-100">
                            {interest}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500 font-medium">Aucun centre d interet renseigne.</p>
                    )}
                  </div>
                </div>
              )}

              {aboutSection === 'account' && (
                <div className="space-y-6">
                  <h3 className="text-[17px] font-black text-slate-900">Compte</h3>
                  <div className="bg-white border border-slate-100 rounded-2xl divide-y divide-slate-100">
                    <div className="p-4 flex justify-between items-center"><span className="text-slate-500 font-semibold">Nom d utilisateur</span><span className="text-slate-900 font-bold">@{profile.username || '-'}</span></div>
                    <div className="p-4 flex justify-between items-center"><span className="text-slate-500 font-semibold">Role</span><span className="text-slate-900 font-bold">{profile.role || 'user'}</span></div>
                    <div className="p-4 flex justify-between items-center"><span className="text-slate-500 font-semibold">Date d inscription</span><span className="text-slate-900 font-bold">{profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</span></div>
                    <div className="p-4 flex justify-between items-center"><span className="text-slate-500 font-semibold">Email</span><span className="text-slate-900 font-bold">{isOwnProfile ? (user?.email || '-') : 'Masque'}</span></div>
                  </div>
                </div>
              )}

              <div className="mt-8 pt-5 border-t border-slate-100">
                <p className="text-slate-600 leading-relaxed text-base">{profile.bio || "Aucune biographie n'a ete ajoutee pour le moment."}</p>
                {isOwnProfile && (
                  <button onClick={() => navigate('/home/profile/edit')} className="mt-4 bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2 rounded-lg font-bold text-sm transition-all">
                    Modifier mon a propos
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      case 'friends':
        if (!canViewProfile) return renderRestrictedProfile();
        return (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex items-center justify-between mb-8 px-2 text-center md:text-left">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Amis ({profile.followers?.length || 0})</h2>
                <div className="hidden md:flex gap-4">
                   <button className="text-pink-600 font-bold text-sm hover:underline">Requêtes</button>
                   <button className="text-pink-600 font-bold text-sm hover:underline">Retrouver des amis</button>
                </div>
             </div>
             {profile.followers?.length === 0 ? (
                <div className="p-20 text-center text-slate-400 italic">Aucun ami à afficher pour le moment.</div>
             ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {profile.followers.map(f => (
                      <div key={f._id} className="flex items-center gap-4 p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-all cursor-pointer group">
                         <img src={f.photos?.[0]?.url || f.googlePhoto || 'https://placehold.co/100'} alt="" className="w-20 h-20 rounded-lg object-cover" />
                         <div className="flex-1">
                            <h4 className="font-black text-slate-800 text-lg group-hover:text-pink-600">{f.firstName} {f.lastName}</h4>
                            <p className="text-sm text-slate-400 font-bold">12 amis commun</p>
                         </div>
                         <button className="bg-slate-100 hover:bg-slate-200 p-2 rounded-lg transition-colors"><FiMoreHorizontal /></button>
                      </div>
                   ))}
                </div>
             )}
          </div>
        );
      case 'photos':
        if (!canViewProfile) return renderRestrictedProfile();
        return (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex items-center justify-between mb-8 px-2">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Photos</h2>
                {isOwnProfile && <button onClick={() => navigate('/home/profile/edit?tab=photos')} className="bg-pink-50 text-pink-600 px-4 py-2 rounded-lg font-black text-sm uppercase tracking-widest transition-all">Ajouter une photo</button>}
             </div>
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {profile.photos?.map((p, i) => (
                   <div key={i} className="aspect-square rounded-xl overflow-hidden border border-slate-100 shadow-sm group cursor-pointer border-transparent hover:border-pink-300">
                      <img src={p.url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                   </div>
                ))}
             </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-[#f0f2f5] min-h-screen">
      <div className="bg-white shadow-sm overflow-hidden pb-4">
        <div className="max-w-5xl mx-auto px-0 md:px-4">
           {/* Cover Photo */}
           <div className="h-[200px] md:h-[350px] w-full relative bg-slate-200 md:rounded-b-xl overflow-hidden">
             <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
             <div className="absolute inset-0 bg-black/5"></div>
             {isOwnProfile && (
                <button 
                  onClick={() => navigate('/home/profile/edit?tab=photos')}
                  className="absolute bottom-4 right-4 bg-white hover:bg-slate-50 text-slate-800 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-sm transition-all"
                >
                   <FiCamera className="text-xl" /> <span className="hidden md:inline">Modifier la couverture</span>
                </button>
             )}
           </div>

           {/* Profile Header Info */}
           <div className="px-4 md:px-8 relative mb-2">
              <div className="flex flex-col md:flex-row items-center md:items-end gap-5 -mt-12 md:-mt-16 sm:gap-4 relative z-10 mb-4 pb-2 border-b border-slate-100">
                 <div className="relative">
                    <div className="w-40 h-40 md:w-44 md:h-44 rounded-full border-[5px] border-white shadow-sm overflow-hidden bg-white">
                       <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                    </div>
                    {isOwnProfile && (
                       <button 
                         onClick={() => navigate('/home/profile/edit?tab=photos')}
                         className="absolute bottom-3 right-3 bg-slate-100 hover:bg-slate-200 p-2.5 rounded-full text-slate-800 shadow-md border border-white transition-all"
                       >
                          <FiCamera className="text-lg" />
                       </button>
                    )}
                 </div>
                 
                 <div className="flex-1 text-center md:text-left md:mb-4">
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-1">
                       {profile.firstName} {profile.lastName}
                       {['admin', 'root'].includes(profile?.role) && <FiShield className="inline ml-2 text-pink-600 text-xl" title={profile?.role === 'root' ? 'Root' : 'Admin'} />}
                    </h1>
                    
                    {/* Statut En Ligne */}
                    <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                       <div className={`w-3 h-3 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.1)] ${showOnlineStatus ? (profile.isOnline ? 'bg-green-500 animate-pulse' : 'bg-slate-400') : 'bg-slate-400'}`}></div>
                       <span className={`text-[11px] font-black uppercase tracking-widest ${showOnlineStatus ? (profile.isOnline ? 'text-green-500' : 'text-slate-400') : 'text-slate-400'}`}>
                          {showOnlineStatus ? (profile.isOnline ? 'en ligne' : 'hors ligne') : 'Statut masqué'}
                       </span>
                    </div>

                    <p className="text-slate-500 font-bold text-lg mb-1">{profile.followers?.length || 0} abonnés • {profile.following?.length || 0} abonnements</p>
                 </div>

                 <div className="flex items-center gap-2 mb-4">
                    {isOwnProfile ? (
                       <>
                          <button onClick={() => toast.success("Bientôt disponible !")} className="bg-pink-600 hover:bg-pink-700 text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-all">
                             <FiPlus className="text-xl" /> Story
                          </button>
                          <Link to="/home/profile/edit" className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-all">
                             <FiEdit2 className="text-xl" /> Modifier
                          </Link>
                       </>
                    ) : (
                       <>
                          <button onClick={handleLike} className={`px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-all ${isLiked ? 'bg-pink-50 text-pink-600' : 'bg-pink-600 text-white hover:bg-pink-700'}`}>
                             <FiHeart className={`text-xl ${isLiked ? 'fill-current' : ''}`} /> {isLiked ? 'Liké' : 'Liker'}
                          </button>
                          <button onClick={handleFollowToggle} className={`px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-all ${isFollowing ? 'bg-slate-100 text-slate-800' : 'bg-slate-900 text-white'}`}>
                             {isFollowing ? <><FiCheck /> Abonné</> : <><FiUserPlus /> S'abonner</>}
                          </button>
                          <button 
                            onClick={() => {
                              if (hasMatch) {
                                window.location.href = `/home/messages?user=${profile._id}`;
                              } else {
                                toast.error("Vous devez avoir un Match mutuel pour discuter avec ce profil.");
                              }
                            }} 
                            className={`p-2.5 rounded-lg transition-all ${hasMatch ? 'bg-slate-100 hover:bg-slate-200 text-slate-800' : 'bg-slate-50 text-slate-300 cursor-not-allowed'}`}
                            title={hasMatch ? "Discuter" : "Match requis pour discuter"}
                          >
                             <FiMessageCircle className="text-xl" />
                          </button>
                          <button onClick={() => setShowReportModal(true)} className="bg-rose-50 hover:bg-rose-100 text-rose-500 p-2.5 rounded-lg transition-colors border border-rose-100" title="Signaler"><FiFlag className="text-xl" /></button>
                       </>
                    )}
                    <button className="bg-slate-100 p-2.5 rounded-lg"><FiMoreHorizontal className="text-xl" /></button>
                 </div>
              </div>

              {/* Tabs Switcher */}
              <div className="flex gap-2 font-bold text-slate-600 text-[15px] px-2 overflow-x-auto no-scrollbar">
                 {[
                   { id: 'posts', label: 'Publications' },
                   { id: 'about', label: 'À propos' },
                   { id: 'friends', label: 'Amis' },
                   { id: 'photos', label: 'Photos' },
                 ].map(t => (
                    <button 
                      key={t.id}
                      onClick={() => setActiveTab(t.id)}
                      className={`px-4 py-3 rounded-lg hover:bg-slate-50 transition-all border-b-[3px] border-transparent whitespace-nowrap ${activeTab === t.id ? 'text-pink-600 border-pink-600' : ''}`}
                    >
                       {t.label}
                    </button>
                 ))}
                 <button onClick={() => toast.success("Section à venir !")} className="px-4 py-3 rounded-lg hover:bg-slate-50 transition-all border-b-[3px] border-transparent whitespace-nowrap">Cadeaux</button>
              </div>
           </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-4">
         <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {renderTabContent()}
         </div>
      </div>

      {showMatchModal && <MatchModal match={matchData} onClose={() => setShowMatchModal(false)} />}
      {showReportModal && <ReportModal reportedUserId={profile?._id} reportedUserName={profile?.firstName} onClose={() => setShowReportModal(false)} />}
    </div>
  );
}

