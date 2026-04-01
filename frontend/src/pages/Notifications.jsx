import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiMessageCircle, FiUserPlus, FiCheckCircle, FiBell } from 'react-icons/fi';
import client from '../api/client';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';

export default function Notifications() {
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
       try { await client.put('/notifications/mark-all-read'); } catch (e) {}
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'like': return <FiHeart className="text-rose-500 fill-current" />;
      case 'comment': return <FiMessageCircle className="text-pink-500" />;
      case 'follow': return <FiUserPlus className="text-blue-500" />;
      case 'match': return <FiCheckCircle className="text-green-500" />;
      default: return <FiBell className="text-slate-400" />;
    }
  };

  if (loading) return <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div></div>;

  return (
    <div className="max-w-xl mx-auto p-4 pb-20">
      <div className="flex items-center justify-between mb-6 px-2">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Notifications</h1>
        <button onClick={fetchNotifications} className="text-xs font-black text-pink-600 uppercase tracking-widest hover:underline">Actualiser</button>
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center shadow-sm">
             <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 opacity-50">
               <FiBell className="w-8 h-8 text-slate-300" />
             </div>
             <p className="text-slate-500 font-bold">Pas encore de notifications.</p>
          </div>
        ) : (
          notifications.map(n => {
            const senderPhoto = n.sender?.photos?.find(p => p.isPrimary)?.url || n.sender?.googlePhoto || 'https://placehold.co/150';
            return (
              <div 
                key={n._id} 
                className={`bg-white p-4 rounded-2xl border-2 transition-all flex gap-4 items-start ${n.read ? 'border-slate-50' : 'border-pink-100 shadow-lg shadow-pink-50 animate-in fade-in slide-in-from-left-2 duration-300'}`}
              >
                <div className="relative">
                  <img src={senderPhoto} alt="" className="w-12 h-12 rounded-full object-cover border border-slate-100" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-50">
                    {getIcon(n.type)}
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="flex flex-wrap gap-1 items-baseline">
                    <Link to={`/home/profile/${n.sender?.username}`} className="font-black text-slate-800 hover:text-pink-600">
                      {n.sender?.firstName} {n.sender?.lastName}
                    </Link>
                    <span className="text-slate-600 text-[14px]">
                      {n.type === 'like' && "a aimé votre publication."}
                      {n.type === 'comment' && `a commenté : "${n.content}"`}
                      {n.type === 'follow' && "s'est abonné à votre profil."}
                      {n.type === 'match' && "Un nouveau match ! Envoyez un message."}
                    </span>
                  </div>
                  <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mt-2">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: fr })}
                  </p>
                </div>

                {n.post && (
                  <Link to={`/home/profile/${user.username}`} className="w-12 h-12 rounded-lg bg-slate-50 overflow-hidden border border-slate-100 flex-shrink-0">
                    {n.post.image ? (
                       <img src={n.post.image} alt="" className="w-full h-full object-cover opacity-80" />
                    ) : (
                      <div className="p-1 text-[8px] text-slate-400 font-medium truncate">{n.post.desc}</div>
                    )}
                  </Link>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
