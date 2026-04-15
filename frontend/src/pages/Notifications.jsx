import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiHeart, FiMessageCircle, FiUserPlus, FiCheckCircle, FiBell, FiMoreHorizontal, FiUserCheck, FiChevronLeft } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import { isToday, isYesterday, isThisWeek } from 'date-fns';
import toast from 'react-hot-toast';

export default function Notifications() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const { data } = await client.get('/notifications');
      setNotifications(data);
    } catch (err) {
      toast.error("Erreur chargement notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Marquer tout comme lu après un court délai
    const timer = setTimeout(async () => {
      try {
        const { data } = await client.put('/notifications/mark-all-read');
        if (data?.modifiedCount > 0) {
          setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })));
          window.dispatchEvent(new CustomEvent('notification:read', {
            detail: { count: 0 }
          }));
        }
      } catch (e) {
        // ignore
      }
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleFollowAction = async (targetId, e) => {
    e.preventDefault(); e.stopPropagation();
    try {
      if (user?.following?.includes(targetId)) {
        await client.put(`/users/${targetId}/unfollow`);
        toast.success("Désabonné");
      } else {
        await client.put(`/users/${targetId}/follow`);
        toast.success("Abonné !");
      }
      refreshUser();
    } catch (err) {
      toast.error("Action impossible");
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.read) {
        await client.put(`/notifications/${notification._id}`);
        setNotifications((prev) =>
          prev.map((item) =>
            item._id === notification._id ? { ...item, read: true } : item
          )
        );
        window.dispatchEvent(new CustomEvent('notification:read', {
          detail: { delta: -1 }
        }));
      }
    } catch (err) {
      console.error('Erreur marque notification lue', err);
    } finally {
      const { type, post, match, sender } = notification;
      const postId = post?._id || post;
      const matchId = match?._id || match;

      if (type === 'like' || type === 'comment') {
        if (postId) {
          navigate(`/home/post/${postId}`);
          return;
        }
      }

      if (type === 'match' || type === 'message') {
        if (matchId) {
          navigate(`/home/messages/${matchId}`);
          return;
        }
      }

      // Par défaut vers le profil de l'expéditeur (pour les follows, etc)
      if (sender?.username) {
        navigate(`/home/profile/${sender.username}`);
      } else {
        navigate('/home');
      }
    }
  };

  const categorizeNotifications = () => {
    const categories = {
      today: { title: 'Aujourd’hui', items: [] },
      yesterday: { title: 'Hier', items: [] },
      thisWeek: { title: 'Cette semaine', items: [] },
      earlier: { title: 'Plus tôt', items: [] }
    };

    notifications.forEach(n => {
      const date = new Date(n.createdAt);
      if (isToday(date)) categories.today.items.push(n);
      else if (isYesterday(date)) categories.yesterday.items.push(n);
      else if (isThisWeek(date)) categories.thisWeek.items.push(n);
      else categories.earlier.items.push(n);
    });

    return Object.values(categories).filter(c => c.items.length > 0);
  };

  if (loading) return (
    <div className="flex justify-center p-20 animate-pulse">
       <div className="w-10 h-10 border-4 border-slate-100 border-t-pink-600 rounded-full animate-spin"></div>
    </div>
  );

  const categories = categorizeNotifications();

  return (
    <div className="max-w-xl mx-auto bg-white min-h-screen md:min-h-[85vh] md:mt-4 md:rounded-3xl md:shadow-xl md:border border-slate-100 overflow-hidden">
      {/* Instagram-style Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md z-40 border-b border-slate-50 px-4 h-16 flex items-center justify-between">
         <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="md:hidden p-2 hover:bg-slate-50 rounded-full transition-all">
               <FiChevronLeft className="text-2xl text-slate-800" />
            </button>
            <h1 className="text-[22px] font-black text-slate-900 tracking-tight">Activité</h1>
         </div>
         <button onClick={fetchNotifications} className="text-pink-600 font-bold text-sm px-2 py-1 rounded hover:bg-pink-50 transition-colors">Actualiser</button>
      </div>

      <div className="pb-24">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 text-center animate-in fade-in duration-700">
             <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100">
                <FiBell className="text-4xl text-slate-200" />
             </div>
             <h3 className="text-xl font-black text-slate-800 mb-2">Aucune activité</h3>
             <p className="text-slate-400 text-sm font-medium leading-relaxed">Les mentions J’aime, les commentaires et les nouveaux abonnés apparaîtront ici.</p>
          </div>
        ) : (
          categories.map(cat => (
            <div key={cat.title} className="mb-2">
               <h2 className="px-6 py-4 text-[15px] font-black text-slate-900 tracking-tight">{cat.title}</h2>
               <div className="divide-y divide-slate-50">
                  {cat.items.map(n => {
                     const senderPhoto = n.sender?.photos?.find(p => p.isPrimary)?.url || n.sender?.googlePhoto || 'https://placehold.co/100';
                     const isFollowing = user?.following?.includes(n.sender?._id);
                     const senderName = n.sender?.username || 'Utilisateur';
                     
                     // Formatage amélioré du temps
                     const now = new Date();
                     const notificationTime = new Date(n.createdAt);
                     const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));
                     const diffInHours = Math.floor(diffInMinutes / 60);
                     const diffInDays = Math.floor(diffInHours / 24);
                     
                     let timeDisplay = '';
                     if (diffInMinutes < 1) {
                        timeDisplay = 'À l\'instant';
                     } else if (diffInMinutes < 60) {
                        timeDisplay = `${diffInMinutes}m`;
                     } else if (diffInHours < 24) {
                        timeDisplay = `${diffInHours}h`;
                     } else if (diffInDays === 1) {
                        timeDisplay = 'Hier';
                     } else if (diffInDays < 7) {
                        timeDisplay = `${diffInDays}j`;
                     } else {
                        timeDisplay = notificationTime.toLocaleDateString('fr-FR', { 
                           day: 'numeric', 
                           month: 'short' 
                        });
                     }
                     
                     return (
                        <div key={n._id} className={`px-6 py-4 hover:bg-slate-50/50 transition-colors group cursor-pointer ${!n.read ? 'bg-pink-50/10' : ''}`} onClick={() => handleNotificationClick(n)}>
                           <div className="flex items-start gap-3">
                              {/* Avatar */}
                              <div className="relative shrink-0">
                                 <img src={senderPhoto} alt="" className="w-[44px] h-[44px] rounded-full object-cover border border-slate-100 shadow-sm" />
                                 {!n.read && <div className="absolute -top-0.5 -right-0.5 w-[14px] h-[14px] bg-pink-600 rounded-full border-2 border-white shadow-sm"></div>}
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                 {/* Nom de l'utilisateur en haut */}
                                 <div className="flex items-center justify-between mb-1">
                                    <span className="font-black text-slate-900 hover:opacity-70 transition-opacity text-[15px]">
                                       {senderName}
                                    </span>
                                    <span className="text-slate-400 text-[12px] font-medium ml-2 shrink-0">
                                       {timeDisplay}
                                    </span>
                                 </div>
                                 
                                 {/* Détails de la notification en bas */}
                                 <div className="text-[13px] text-slate-600 leading-[18px] mb-2">
                                    {n.content ? (
                                       <>
                                          {n.type === 'comment' && (
                                             <span>
                                                a commenté: <span className="font-medium italic">"{n.content.length > 50 ? `${n.content.substring(0, 50)}...` : n.content}"</span>
                                             </span>
                                          )}
                                          {n.type === 'like' && "a aimé votre publication"}
                                          {n.type === 'follow' && "a commencé à vous suivre"}
                                          {n.type === 'match' && "Un nouveau match ! Envoyez un message"}
                                       </>
                                    ) : (
                                       <>
                                          {n.type === 'like' && "a aimé votre publication"}
                                          {n.type === 'comment' && "a commenté votre publication"}
                                          {n.type === 'follow' && "a commencé à vous suivre"}
                                          {n.type === 'match' && "Un nouveau match ! Envoyez un message"}
                                       </>
                                    )}
                                 </div>
                              </div>

                           {/* Right Action/Preview */}
                           <div className="shrink-0 flex items-center justify-end min-w-[44px]">
                              {n.type === 'follow' ? (
                                 <button 
                                    onClick={(e) => handleFollowAction(n.sender?._id, e)}
                                    className={`px-4 py-1.5 rounded-lg text-[13px] font-black transition-all ${isFollowing ? 'bg-slate-100 text-slate-800 hover:bg-slate-200' : 'bg-pink-600 text-white hover:bg-pink-700 shadow-lg shadow-pink-100'}`}
                                 >
                                    {isFollowing ? 'Abonné(e)' : 'S’abonner'}
                                 </button>
                              ) : n.post ? (
                                 <div className="w-[44px] h-[44px] rounded-lg bg-slate-50 overflow-hidden border border-slate-100">
                                    {n.post.image ? (
                                       <img src={n.post.image} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                       <div className="p-1 text-[8px] text-slate-400 font-bold overflow-hidden">{n.post.desc}</div>
                                    )}
                                 </div>
                              ) : (
                                 <FiMoreHorizontal className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                              )}
                           </div>
                           </div>
                        </div>
                     );
                  })}
               </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
