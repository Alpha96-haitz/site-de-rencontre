import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiMessageCircle, FiUser, FiInfo, FiStar, FiChevronRight, FiFlag } from 'react-icons/fi';
import client from '../api/client';
import ReportModal from '../components/ReportModal';

export default function Matches() {
  const [matches, setMatches] = useState([]);
  const [likes, setLikes] = useState([]);
  const [tab, setTab] = useState('matches');
  const [loading, setLoading] = useState(true);
  const [reportModal, setReportModal] = useState(null); // userId or null

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [mRes, lRes] = await Promise.all([
          client.get('/matches'),
          client.get('/matches/likes-received')
        ]);
        setMatches(mRes.data);
        setLikes(lRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const list = tab === 'matches' ? matches : likes;

  const getUserData = (item) => {
    const u = item.matchedUser || item.likedBy;
    const photo = u?.photos?.find((p) => p.isPrimary) || u?.photos?.[0];
    return {
      id: u?._id,
      username: u?.username,
      firstName: u?.firstName || 'Inconnu',
      lastName: u?.lastName || '',
      age: u?.age || 25,
      photoUrl: photo?.url || u?.googlePhoto || 'https://placehold.co/150'
    };
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-24 font-sans bg-slate-50 min-h-screen">
      {/* Tinder Style Tabs */}
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex items-center justify-between">
           <h1 className="text-3xl font-black text-slate-800 tracking-tighter">Votre activité</h1>
           <FiStar className="text-amber-400 w-6 h-6" />
        </div>

        <div className="flex border-b border-slate-200">
           <button 
             onClick={() => setTab('matches')}
             className={`pb-3 px-4 text-sm font-black uppercase tracking-widest transition-all relative ${tab === 'matches' ? 'text-pink-600' : 'text-slate-400'}`}
           >
             {matches.length} Matches
             {tab === 'matches' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-pink-600 rounded-t-full"></div>}
           </button>
           <button 
             onClick={() => setTab('likes')}
             className={`pb-3 px-4 text-sm font-black uppercase tracking-widest transition-all relative ${tab === 'likes' ? 'text-pink-600' : 'text-slate-400'}`}
           >
             {likes.length} Likes
             {tab === 'likes' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-pink-600 rounded-t-full"></div>}
           </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
           <div className="w-12 h-12 border-4 border-pink-100 border-t-pink-600 rounded-full animate-spin"></div>
           <p className="mt-4 text-slate-400 font-bold uppercase text-[10px] tracking-widest">Chargement...</p>
        </div>
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-8 text-center bg-white rounded-[40px] shadow-sm border border-slate-100">
           <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center mb-6 relative">
              <FiHeart className="w-10 h-10 text-pink-300 animate-pulse" />
           </div>
           <h2 className="text-xl font-black text-slate-800 mb-2">Pas encore de nouveau {tab === 'matches' ? 'match' : 'like'}</h2>
           <p className="text-slate-400 text-sm max-w-xs font-medium">Continuez à découvrir d'autres profils pour augmenter vos chances de faire de belles rencontres.</p>
           <Link to="/home/discover" className="mt-8 bg-gradient-to-r from-pink-600 to-rose-600 text-white px-8 py-3 rounded-full font-black text-sm uppercase tracking-widest shadow-xl shadow-pink-100 hover:scale-105 active:scale-95 transition-all">
             Découvrir des profils
           </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {list.map((item) => {
            const userData = getUserData(item);
            return (
              <div key={item._id} className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-slate-200 shadow-sm hover:shadow-xl transition-all duration-500">
                <img src={userData.photoUrl} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                
                {/* Lighter Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4">
                  <h3 className="text-white font-black text-lg leading-tight truncate">
                    {userData.firstName}, {userData.age}
                  </h3>
                  
                  <div className="flex items-center gap-2 mt-2">
                     {tab === 'matches' ? (
                       <Link 
                         to={`/home/messages/${item._id}`}
                         className="flex-1 bg-white/20 backdrop-blur-md hover:bg-white text-white hover:text-pink-600 border border-white/20 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter text-center transition-all flex items-center justify-center gap-2"
                       >
                         <FiMessageCircle className="w-3.5 h-3.5" /> Message
                       </Link>
                     ) : (
                       <Link 
                         to={`/home/profile/${userData.username}`}
                         className="flex-1 bg-white/20 backdrop-blur-md hover:bg-white text-white hover:text-pink-600 border border-white/20 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter text-center transition-all flex items-center justify-center gap-2"
                       >
                         <FiUser className="w-3.5 h-3.5" /> Profil
                       </Link>
                     )}
                     <button 
                       onClick={() => setReportModal(userData.id)}
                       className="bg-rose-500/20 backdrop-blur-md hover:bg-rose-600 text-white border border-rose-400/30 p-2 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all"
                       title="Signaler"
                     >
                       <FiFlag className="w-3.5 h-3.5" />
                     </button>
                  </div>
                </div>

                {/* Match Badge */}
                {tab === 'matches' && (
                  <div className="absolute top-3 left-3 bg-pink-600 text-white p-1.5 rounded-lg shadow-lg">
                    <FiHeart className="w-3 h-3 fill-white" />
                  </div>
                )}
                
                {/* Like Badge */}
                {tab === 'likes' && (
                  <div className="absolute top-3 left-3 bg-amber-400 text-[#111b21] px-2 py-1 rounded-lg shadow-lg flex items-center gap-1">
                    <FiStar className="w-3 h-3 fill-current" />
                    <span className="text-[10px] font-black uppercase tracking-tighter italic">Liker</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Discover Banner Bottom */}
      {list.length > 0 && (
         <div className="mt-12 p-8 bg-gradient-to-br from-pink-600 to-rose-600 rounded-[40px] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-pink-200">
            <div>
               <h2 className="text-2xl font-black tracking-tight mb-2">Envie de plus de matches ?</h2>
               <p className="text-pink-100 text-sm font-bold opacity-80">Plus vous swipez, plus vous avez de chances de trouver l'amour.</p>
            </div>
            <Link to="/home/discover" className="bg-white text-pink-600 px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
               Swiper Maintenant <FiChevronRight />
            </Link>
         </div>
      )}

      {/* Report Modal */}
      {reportModal && (
        <ReportModal 
          reportedUserId={reportModal}
          reportedUserName={list.find(item => {
            const u = item.matchedUser || item.likedBy;
            return u?._id === reportModal;
          })?.matchedUser?.firstName || list.find(item => item.likedBy?._id === reportModal)?.likedBy?.firstName}
          onClose={() => setReportModal(null)}
        />
      )}
    </div>
  );
}
