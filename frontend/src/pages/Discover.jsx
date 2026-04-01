import { useState, useEffect } from 'react';
import { FiX, FiHeart, FiStar, FiInfo, FiRefreshCw, FiMapPin, FiNavigation } from 'react-icons/fi';
import client from '../api/client';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export default function Discover() {
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [direction, setDirection] = useState(null); // 'left' or 'right'

  const fetchCards = async () => {
    setLoading(true);
    try {
      const { data } = await client.get('/users/suggestions');
      setCards(data);
      setCurrentIndex(0);
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
    if (currentIndex >= cards.length) return;
    
    const targetId = cards[currentIndex]._id;
    setDirection(type === 'like' ? 'right' : 'left');

    try {
      if (type === 'like') {
        const { data } = await client.post(`/matches/like/${targetId}`);
        if (data.isMutual) {
          toast.success("C'est un Match ! 🎉", { duration: 4000, icon: '🔥' });
        }
      } else {
        await client.post(`/matches/dislike/${targetId}`);
      }
    } catch (err) {
      console.error(err);
    }

    // Attendre l'animation avant de passer à la suivante
    setTimeout(() => {
      setDirection(null);
      setCurrentIndex(prev => prev + 1);
    }, 300);
  };

  if (loading) return <div className="flex justify-center p-12"><div className="w-12 h-12 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div></div>;

  const currentCard = cards[currentIndex];

  return (
    <div className="max-w-md mx-auto p-4 flex flex-col h-[calc(100vh-80px)] md:h-[calc(100vh-64px)] justify-center">
      <div className="relative flex-1 max-h-[650px] w-full perspective-1000">
        {currentCard ? (
          <div 
            className={`absolute inset-0 bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 transition-all duration-300 transform origin-bottom
              ${direction === 'right' ? 'translate-x-[150%] rotate-[30deg] opacity-0' : ''}
              ${direction === 'left' ? '-translate-x-[150%] -rotate-[30deg] opacity-0' : ''}
            `}
          >
            {/* Image & Overlay */}
            <div className="h-full w-full relative">
              <img 
                src={currentCard.photos?.find(p => p.isPrimary)?.url || currentCard.googlePhoto || 'https://placehold.co/600x800?text=Profil'} 
                alt={currentCard.firstName} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
              
              {/* Profile Info Overlay */}
              <div className="absolute bottom-0 p-6 text-white w-full">
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-3xl font-black">{currentCard.firstName}, {currentCard.age}</h2>
                  {currentCard.isOnline && <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>}
                </div>
                <div className="flex items-center gap-2 text-sm font-bold opacity-80 mb-3">
                  <FiMapPin className="w-4 h-4" /> {currentCard.location?.city || 'Près de vous'}
                </div>
                <p className="text-sm line-clamp-2 font-medium mb-4 opacity-90">{currentCard.bio || 'Cet utilisateur n\'a pas encore de bio.'}</p>
                
                {/* Interests chips */}
                <div className="flex flex-wrap gap-2">
                  {currentCard.interests?.slice(0, 3).map(i => (
                    <span key={i} className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-wider border border-white/10">
                      {i}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-dashed border-slate-200 p-8 text-center animate-in zoom-in duration-500">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
               <FiRefreshCw className="w-10 h-10 text-slate-300" />
             </div>
             <h2 className="text-2xl font-black text-slate-800 mb-2">Plus personne ?</h2>
             <p className="text-sm text-slate-500 font-medium mb-8 max-w-xs mx-auto">Vous avez fait le tour des profils autour de vous. Revenez plus tard ou élargissez vos critères.</p>
             <button onClick={fetchCards} className="px-8 py-3 bg-pink-600 text-white rounded-2xl font-black shadow-lg shadow-pink-100 hover:scale-105 transition-all">Recharger les profils</button>
          </div>
        )}

        {/* Swipe Indicators */}
        {direction === 'right' && (
          <div className="absolute top-10 left-10 border-4 border-green-500 text-green-500 px-6 py-2 rounded-xl font-black text-4xl uppercase rotate-[-20deg] z-50 animate-in zoom-in duration-100 uppercase">LIKE</div>
        )}
        {direction === 'left' && (
          <div className="absolute top-10 right-10 border-4 border-rose-500 text-rose-500 px-6 py-2 rounded-xl font-black text-4xl uppercase rotate-[20deg] z-50 animate-in zoom-in duration-100 uppercase">NOPE</div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-6 mt-8">
        <button 
          onClick={() => handleAction('dislike')}
          disabled={!currentCard || direction}
          className="w-16 h-16 bg-white border border-slate-100 rounded-full flex items-center justify-center shadow-xl text-rose-500 hover:bg-rose-50 hover:scale-110 active:scale-95 transition-all disabled:opacity-50"
        >
          <FiX className="w-8 h-8 stroke-[3]" />
        </button>
        <button 
          onClick={fetchCards}
          className="w-12 h-12 bg-white border border-slate-100 rounded-full flex items-center justify-center shadow-md text-amber-500 hover:bg-amber-50 hover:scale-110 active:scale-90 transition-all disabled:opacity-50"
        >
          <FiRefreshCw className="w-5 h-5 stroke-[3]" />
        </button>
        <button 
          onClick={() => handleAction('like')}
          disabled={!currentCard || direction}
          className="w-16 h-16 bg-white border border-slate-100 rounded-full flex items-center justify-center shadow-xl text-green-500 hover:bg-green-50 hover:scale-110 active:scale-95 transition-all disabled:opacity-50"
        >
          <FiHeart className="w-8 h-8 fill-current stroke-[3]" />
        </button>
      </div>

      {/* Bottom info link */}
      {currentCard && (
        <div className="mt-4 text-center">
          <Link to={`/home/profile/${currentCard.username}`} className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2 hover:text-slate-800 transition-colors">
            <FiInfo /> Voir le profil complet
          </Link>
        </div>
      )}
    </div>
  );
}
