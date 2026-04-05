import { useState, useEffect, useCallback } from 'react';
import { FiX, FiHeart, FiStar, FiInfo, FiRefreshCw, FiMapPin, FiNavigation, FiRotateCcw, FiChevronLeft, FiChevronRight, FiZap, FiMessageCircle, FiFlag } from 'react-icons/fi';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import ReportModal from '../components/ReportModal';

export default function Discover() {
  const { user: currentUserData } = useAuth();
  const [cards, setCards] = useState([]);
  const [history, setHistory] = useState([]); // Pour le bouton "Retourner" (Undo)
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [direction, setDirection] = useState(null); // 'left' or 'right'
  
  // États pour le Match Modal (Style Tinder)
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchData, setMatchData] = useState(null);
  
  // State pour le Report Modal
  const [showReportModal, setShowReportModal] = useState(false);
  
  const navigate = useNavigate();

  const fetchCards = async () => {
    setLoading(true);
    try {
      const { data } = await client.get('/users/suggestions');
      const uniqueCards = Array.from(new Map((data || []).map((u) => [u._id, u])).values());
      setCards(uniqueCards);
      setCurrentIndex(0);
      setHistory([]);
    } catch (err) {
      toast.error("Erreur chargement suggestions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const handleAction = async (type) => {
    if (currentIndex >= cards.length || direction) return;
    
    const currentCard = cards[currentIndex];
    const targetId = currentCard._id;
    
    // Sauvegarder dans l'historique pour le Undo
    setHistory(prev => [...prev, { card: currentCard, index: currentIndex, type }]);
    
    setDirection(type === 'like' ? 'right' : 'left');

    try {
      if (type === 'like') {
        const { data } = await client.post(`/matches/like/${targetId}`);
        if (data.isMutual) {
          setMatchData({
            user: currentCard,
            matchId: data.match._id
          });
          setTimeout(() => setShowMatchModal(true), 500); // Délai pour laisser finir l'animation de swipe
        }
      } else {
        await client.post(`/matches/dislike/${targetId}`);
      }
    } catch (err) {
      console.error(err);
    }

    setTimeout(() => {
      setDirection(null);
      setCurrentIndex(prev => prev + 1);
    }, 300);
  };

  const handleUndo = () => {
    if (history.length === 0) {
      toast.error("Rien à annuler !");
      return;
    }
    const lastAction = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    setCurrentIndex(lastAction.index);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20">
      <div className="w-16 h-16 border-4 border-pink-100 border-t-pink-600 rounded-full animate-spin"></div>
      <p className="mt-4 text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] animate-pulse">Recherche de profils...</p>
    </div>
  );

  const currentCard = cards[currentIndex];
  
  const myPhoto = currentUserData?.photos?.find(p => p.isPrimary)?.url || currentUserData?.googlePhoto || 'https://placehold.co/150';
  const matchPhoto = matchData?.user?.photos?.find(p => p.isPrimary)?.url || matchData?.user?.googlePhoto || 'https://placehold.co/600x800?text=Profil';

  return (
    <div className="max-w-md mx-auto p-4 flex flex-col h-[calc(100vh-80px)] md:h-[calc(100vh-64px)] justify-center font-sans relative">
      
      {/* MATCH MODAL (Tinder Style) */}
      {showMatchModal && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-6 animate-in fade-in duration-500 backdrop-blur-xl">
           <div className="text-center mb-12 animate-in zoom-in slide-in-from-top-10 duration-700 delay-200">
             <h1 className="text-6xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-400 drop-shadow-2xl tracking-tighter mb-4" style={{ fontFamily: "'Dancing Script', cursive" }}>
               It's a Match!
             </h1>
             <p className="text-white/60 font-black uppercase tracking-widest text-xs">Vous et {matchData?.user?.firstName} vous plaisez mutuellement.</p>
           </div>

           <div className="flex items-center justify-center gap-4 mb-20 relative">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-2xl overflow-hidden -rotate-6 animate-in slide-in-from-left-20 duration-700">
                 <img src={myPhoto} alt="" className="w-full h-full object-cover" />
              </div>
              <FiHeart className="absolute w-12 h-12 text-pink-500 fill-current z-10 animate-ping-slow drop-shadow-lg" />
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-2xl overflow-hidden rotate-6 animate-in slide-in-from-right-20 duration-700">
                 <img src={matchPhoto} alt="" className="w-full h-full object-cover" />
              </div>
           </div>

           <div className="w-full max-w-xs space-y-4 animate-in slide-in-from-bottom-20 duration-700 delay-300 px-4">
              <button 
                onClick={() => navigate(`/home/messages/${matchData.matchId}`)}
                className="w-full bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-full py-4 text-sm font-black uppercase tracking-widest shadow-2xl shadow-pink-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <FiMessageCircle className="w-5 h-5" /> Envoyer un message
              </button>
              <button 
                onClick={() => setShowMatchModal(false)}
                className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-full py-4 text-sm font-black uppercase tracking-widest transition-all"
              >
                Continuer à découvrir
              </button>
           </div>
           
           <button 
             onClick={() => setShowMatchModal(false)}
             className="absolute top-8 right-8 text-white/40 hover:text-white transition-all"
           >
             <FiX className="w-8 h-8" />
           </button>
        </div>
      )}

      {/* Main Swipe Interface */}
      <div className="relative flex-1 max-h-[600px] w-full perspective-1000">
        {currentCard ? (
          <div 
            className={`absolute inset-0 bg-white rounded-[40px] shadow-2xl overflow-hidden border border-slate-100 transition-all duration-300 transform origin-bottom
              ${direction === 'right' ? 'translate-x-[150%] rotate-[30deg] opacity-0' : ''}
              ${direction === 'left' ? '-translate-x-[150%] -rotate-[30deg] opacity-0' : ''}
            `}
          >
            {/* Image & Overlay */}
            <div className="h-full w-full relative group">
              <img 
                src={currentCard.photos?.find(p => p.isPrimary)?.url || currentCard.googlePhoto || 'https://placehold.co/600x800?text=Profil'} 
                alt={currentCard.firstName} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
              
              {/* Profile Info Overlay */}
              <div className="absolute bottom-0 p-8 text-white w-full">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-3xl font-black tracking-tight">{currentCard.firstName}, {currentCard.age}</h2>
                  {currentCard.isOnline && <div className="w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>}
                </div>
                <div className="flex items-center gap-2 text-sm font-bold opacity-80 mb-4 bg-black/20 backdrop-blur-md w-fit px-3 py-1 rounded-full">
                  <FiMapPin className="w-4 h-4 text-pink-500" /> {currentCard.location?.city || 'Près de vous'}
                </div>
                <p className="text-[15px] line-clamp-3 font-medium mb-6 opacity-90 leading-relaxed">{currentCard.bio || 'Cet utilisateur n\'a pas encore de bio.'}</p>
                
                {/* Interests chips */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {currentCard.interests?.slice(0, 3).map(i => (
                    <span key={i} className="px-3.5 py-1.5 bg-white/10 backdrop-blur-xl rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/10">
                      {i}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white rounded-[40px] border-2 border-dashed border-slate-200 p-8 text-center shadow-inner">
             <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-8 shadow-xl">
               <FiRefreshCw className="w-10 h-10 text-slate-300 animate-spin-slow" />
             </div>
             <h2 className="text-3xl font-black text-slate-800 mb-3 tracking-tighter">C'est tout pour aujourd'hui !</h2>
             <p className="text-slate-400 font-bold mb-10 max-w-xs mx-auto leading-relaxed">Vous avez découvert tous les profils de votre secteur. Revenez demain !</p>
             <button onClick={fetchCards} className="px-10 py-4 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-pink-200 hover:scale-105 active:scale-95 transition-all">
               Recharger tout
             </button>
          </div>
        )}

        {/* Swipe Indicators */}
        {direction === 'right' && (
          <div className="absolute top-12 left-12 border-4 border-[#2ecc71] text-[#2ecc71] px-6 py-2 rounded-2xl font-black text-5xl uppercase rotate-[-25deg] z-50 animate-in zoom-in duration-100 tracking-tighter">LIKE</div>
        )}
        {direction === 'left' && (
          <div className="absolute top-12 right-12 border-4 border-[#e74c3c] text-[#e74c3c] px-6 py-2 rounded-2xl font-black text-5xl uppercase rotate-[25deg] z-50 animate-in zoom-in duration-100 tracking-tighter">NOPE</div>
        )}
      </div>

      <div className="flex items-center justify-center gap-4 mt-10">
        <button 
          onClick={handleUndo}
          className="w-12 h-12 bg-white border border-slate-50 rounded-full flex items-center justify-center shadow-xl text-[#f1c40f] hover:scale-110 active:scale-90 transition-all disabled:opacity-50 hover:bg-[#f1c40f] hover:text-white hover:shadow-[#f1c40f]/30"
          title="Annuler la dernière action"
        >
          <FiRotateCcw className="w-6 h-6 stroke-[3]" />
        </button>

        <button 
          onClick={() => handleAction('dislike')}
          className="w-16 h-16 bg-white border border-slate-50 rounded-full flex items-center justify-center shadow-2xl text-[#f5515d] hover:scale-110 active:scale-95 transition-all disabled:opacity-50 hover:bg-[#f5515d] hover:text-white hover:shadow-[#f5515d]/30"
          title="Pas intéressé"
        >
          <FiX className="w-9 h-9 stroke-[4]" />
        </button>

        <button 
          onClick={() => toast.info("Fonctionnalité Super Like bientôt disponible !")}
          className="w-12 h-12 bg-white border border-slate-50 rounded-full flex items-center justify-center shadow-xl text-[#3498db] hover:scale-110 active:scale-90 transition-all hover:bg-[#3498db] hover:text-white hover:shadow-[#3498db]/30"
          title="Super Like (Premium)"
        >
          <FiStar className="w-6 h-6 fill-current" />
        </button>

        <button 
          onClick={() => handleAction('like')}
          className="w-16 h-16 bg-white border border-slate-50 rounded-full flex items-center justify-center shadow-2xl text-[#2ecc71] hover:scale-110 active:scale-95 transition-all disabled:opacity-50 hover:bg-[#2ecc71] hover:text-white hover:shadow-[#2ecc71]/30"
          title="J'aime"
        >
          <FiHeart className="w-9 h-9 fill-current" />
        </button>

        <button 
          onClick={() => toast.info("Mode Boost bientôt disponible !")}
          className="w-12 h-12 bg-white border border-slate-50 rounded-full flex items-center justify-center shadow-xl text-[#9b59b6] hover:scale-110 active:scale-90 transition-all hover:bg-[#9b59b6] hover:text-white hover:shadow-[#9b59b6]/30"
          title="Boost de visibilité (Premium)"
        >
          <FiZap className="w-6 h-6 fill-current" />
        </button>
      </div>

      {currentCard && (
        <div className="mt-8 text-center flex items-center justify-center gap-6">
           <button 
             onClick={() => setShowReportModal(true)} 
             className="w-10 h-10 bg-slate-800/60 backdrop-blur-md border border-slate-600/40 rounded-full flex items-center justify-center text-slate-300 hover:text-rose-400 hover:bg-rose-500/30 hover:border-rose-400/50 transition-all shadow-lg"
             title="Signaler ce profil"
           >
             <FiFlag className="w-5 h-5" />
           </button>
           <button 
             onClick={() => toast.info("Navigation désactivée - Utilisez le swipe !")}
             className="w-10 h-10 bg-slate-800/40 backdrop-blur-md border border-slate-600/30 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-300 transition-all opacity-50 cursor-not-allowed"
             title="Navigation désactivée"
             disabled
           >
             <FiChevronLeft className="w-5 h-5" />
           </button>
           <Link 
             to={`/home/profile/${currentCard.username}`} 
             className="px-6 py-3 bg-slate-800/60 backdrop-blur-md border border-slate-600/40 rounded-full text-slate-200 hover:text-white hover:bg-slate-700/70 hover:border-slate-500/50 transition-all shadow-lg font-bold text-sm flex items-center gap-2"
             title="Voir le profil complet"
           >
             <FiInfo className="w-4 h-4" /> Profil
           </Link>
           <button 
             onClick={() => toast.info("Navigation désactivée - Utilisez le swipe !")}
             className="w-10 h-10 bg-slate-800/40 backdrop-blur-md border border-slate-600/30 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-300 transition-all opacity-50 cursor-not-allowed"
             title="Navigation désactivée"
             disabled
           >
             <FiChevronRight className="w-5 h-5" />
           </button>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && currentCard && (
        <ReportModal 
          reportedUserId={currentCard._id} 
          reportedUserName={currentCard.firstName} 
          onClose={() => setShowReportModal(false)} 
        />
      )}

      {/* Google Font for script text */}
      <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap" rel="stylesheet" />

      <style>{`
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
        .animate-ping-slow {
          animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .perspective-1000 {
          perspective: 1000px;
        }
      `}</style>
    </div>
  );
}
