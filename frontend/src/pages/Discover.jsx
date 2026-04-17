import { useState, useEffect, useCallback, useMemo } from 'react';
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

  const fetchCards = useCallback(async (isRecycling = false) => {
    setLoading(true);
    try {
      const { data } = await client.get(`/users/suggestions${isRecycling ? '?recycle=true' : ''}`);
      const uniqueCards = Array.from(new Map((data || []).map((u) => [u._id, u])).values());
      
      if (uniqueCards.length === 0 && !isRecycling) {
        // Tentative automatique de recyclage si aucun nouveau profil
        return fetchCards(true);
      }

      setCards(uniqueCards);
      setCurrentIndex(0);
      setHistory([]);
    } catch (err) {
      toast.error("Erreur chargement suggestions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const handleAction = useCallback(async (type) => {
    if (currentIndex >= cards.length || direction) return;
    
    const activeCard = cards[currentIndex];
    const targetId = activeCard._id;

    // Protection recyclage : Interdire le like si le profil est recyclé
    if (type === 'like' && activeCard.isRecycled) {
      toast.error("Vous avez déjà ignoré ce profil. Like impossible sur un profil recyclé.", { 
        icon: '🚫',
        duration: 4000 
      });
      return;
    }

    // Sauvegarder dans l'historique pour le Undo
    setHistory(prev => [...prev, { card: activeCard, index: currentIndex, type }]);
    setDirection(type === 'like' ? 'right' : 'left');

    try {
      if (type === 'like') {
        const { data } = await client.post(`/matches/like/${targetId}`);
        if (data.alreadyLiked) {
          toast.info(data.message || "Vous avez déjà liké cet utilisateur");
          setDirection(null);
          setCurrentIndex(prev => prev + 1);
          return;
        }
        if (data.isMutual) {
          setMatchData({
            user: activeCard,
            matchId: data.match._id
          });
          setTimeout(() => setShowMatchModal(true), 500);
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
  }, [currentIndex, cards, direction]);

  const handleRefresh = () => fetchCards(true);


  const handleUndo = useCallback(() => {
    if (history.length === 0) {
      toast.error("Rien à annuler !");
      return;
    }
    const lastAction = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    setCurrentIndex(lastAction.index);
  }, [history]);

  const currentCard = useMemo(() => cards[currentIndex], [cards, currentIndex]);
  
  const myPhoto = useMemo(() => 
    currentUserData?.photos?.find(p => p.isPrimary)?.url || currentUserData?.googlePhoto || 'https://placehold.co/150'
  , [currentUserData]);

  const matchPhoto = useMemo(() => 
    matchData?.user?.photos?.find(p => p.isPrimary)?.url || matchData?.user?.googlePhoto || 'https://placehold.co/600x800?text=Profil'
  , [matchData]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 min-h-[400px]">
      <div className="w-16 h-16 border-4 border-pink-100 border-t-pink-600 rounded-full animate-spin"></div>
      <p className="mt-4 text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] animate-pulse">Recherche de profils...</p>
    </div>
  );

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
                 <img src={myPhoto} alt="" className="w-full h-full object-cover" loading="lazy" />
              </div>
              <FiHeart className="absolute w-12 h-12 text-pink-500 fill-current z-10 animate-ping-slow drop-shadow-lg" />
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-2xl overflow-hidden rotate-6 animate-in slide-in-from-right-20 duration-700">
                 <img src={matchPhoto} alt="" className="w-full h-full object-cover" loading="lazy" />
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
      <div className="relative aspect-square w-full max-h-[420px] mx-auto perspective-2000 px-2 md:px-0 z-10">
        {currentCard ? (
          <div 
            className={`absolute inset-0 bg-slate-900 rounded-[50px] shadow-[0_30px_100px_rgba(0,0,0,0.5)] overflow-hidden border border-white/10 transition-all duration-500 ease-out transform-gpu
              ${direction === 'right' ? 'translate-x-[200%] rotate-[45deg] scale-110 opacity-0' : ''}
              ${direction === 'left' ? '-translate-x-[200%] -rotate-[45deg] scale-110 opacity-0' : ''}
            `}
          >
            {/* Image & Overlay */}
            <div className="h-full w-full relative group">
              <img 
                src={currentCard.photos?.find(p => p.isPrimary)?.url || currentCard.googlePhoto || 'https://placehold.co/600x800?text=Profil'} 
                alt={currentCard.firstName} 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                loading="eager"
              />
              
              {/* Dynamic Gradient with better mix-blend */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
              
              {/* Profile Info Overlay - Glassmorphism style */}
              <div className="absolute bottom-0 p-5 w-full text-white">
                <div className="backdrop-blur-md bg-black/5 border border-white/5 rounded-[25px] p-5 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-pink-500 to-rose-500"></div>
                  
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-black tracking-tight drop-shadow-md">{currentCard.firstName}, {currentCard.age}</h2>
                      {currentCard.isRecycled && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-yellow-500/20 rounded-full border border-yellow-500/30">
                          <FiRefreshCw className="w-2.5 h-2.5 text-yellow-500 animate-spin-slow" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400">Recyclé</span>
                        </div>
                      )}
                      {currentCard.isOnline && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/20 rounded-full border border-green-500/30">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                          <span className="text-[9px] font-black uppercase tracking-widest text-green-400">Online</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-black text-white/60 mb-3 bg-white/5 w-fit px-3 py-1.5 rounded-xl border border-white/5">
                    <FiMapPin className="w-3.5 h-3.5 text-pink-500" /> 
                    <span className="uppercase tracking-[0.1em]">{currentCard.location?.city || 'Ville inconnue'}</span>
                  </div>

                  <p className="text-base font-medium mb-3 text-white/80 leading-snug italic line-clamp-2">
                    "{currentCard.bio || 'Cet utilisateur n\'a pas encore de bio.'}"
                  </p>
                  
                  {/* Interests chips - Premium style */}
                  <div className="flex flex-wrap gap-3">
                    {currentCard.interests?.slice(0, 4).map(i => (
                      <span key={i} className="px-5 py-2 bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-md rounded-full text-[11px] font-bold text-white/90 border border-white/10 hover:border-pink-500/40 transition-colors cursor-default">
                        {i}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 rounded-[50px] border border-white/5 p-12 text-center shadow-2xl">
             <div className="w-32 h-32 bg-white/5 rounded-full flex items-center justify-center mb-10 shadow-[0_0_50px_rgba(236,72,153,0.1)] border border-white/10">
               <FiRefreshCw className="w-14 h-14 text-pink-500 animate-spin-slow opacity-50" />
             </div>
             <h2 className="text-4xl font-black text-white mb-4 tracking-tighter">Deck terminé !</h2>
             <p className="text-white/40 font-bold mb-12 max-w-sm mx-auto leading-relaxed text-lg italic">Vous avez exploré tous les nouveaux profils. Voulez-vous revoir ceux que vous avez ignorés ?</p>
             <button onClick={handleRefresh} className="px-12 py-5 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-[25px] font-black uppercase tracking-[0.2em] shadow-[0_20px_40px_rgba(217,119,6,0.3)] hover:scale-105 active:scale-95 transition-all duration-300">
               Recycler les profils
             </button>
          </div>
        )}

        {/* Improved Swipe Indicator Stencils */}
        {direction === 'right' && (
          <div className="absolute top-20 left-20 border-[6px] border-[#2ecc71] text-[#2ecc71] px-10 py-4 rounded-[30px] font-black text-6xl uppercase rotate-[-25deg] z-[60] animate-in zoom-in duration-150 tracking-tighter shadow-2xl skew-x-[-10deg]">VIBE</div>
        )}
        {direction === 'left' && (
          <div className="absolute top-20 right-20 border-[6px] border-[#f43f5e] text-[#f43f5e] px-10 py-4 rounded-[30px] font-black text-6xl uppercase rotate-[25deg] z-[60] animate-in zoom-in duration-150 tracking-tighter shadow-2xl skew-x-[10deg]">PASS</div>
        )}
      </div>

      <div className="flex items-center justify-center gap-4 mt-4 z-20 relative">
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
          className={`w-16 h-16 bg-white border border-slate-50 rounded-full flex items-center justify-center shadow-2xl transition-all disabled:opacity-50 
            ${currentCard?.isRecycled 
              ? 'text-slate-300 cursor-not-allowed grayscale' 
              : 'text-[#2ecc71] hover:scale-110 active:scale-95 hover:bg-[#2ecc71] hover:text-white hover:shadow-[#2ecc71]/30'}`}
          title={currentCard?.isRecycled ? "Like impossible (recyclé)" : "J'aime"}
          disabled={currentCard?.isRecycled}
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
        <div className="mt-4 pb-4 text-center flex items-center justify-center gap-6 z-20 relative">
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
