import { useState, useEffect, useCallback } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { FiHome, FiCompass, FiMessageCircle, FiHeart, FiUser, FiSearch, FiBell, FiLogOut, FiSettings, FiX, FiShield } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import debounce from 'lodash.debounce';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Récupérer le nombre de notifications non lues
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const { data } = await client.get('/notifications');
        const unread = data.filter(n => !n.read).length;
        setUnreadCount(unread);
      } catch (e) {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000); // 30s
    return () => clearInterval(interval);
  }, []);

  const fetchResults = useCallback(
    debounce(async (query) => {
      if (!query.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }
      try {
        const { data } = await client.get(`/users/search?q=${query}&limit=5`);
        setSearchResults(data);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    if (searchTerm.trim()) {
      setIsSearching(true);
      fetchResults(searchTerm);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [searchTerm, fetchResults]);

  const nav = [
    { to: '/home', icon: FiHome, label: 'Accueil' },
    { to: '/home/discover', icon: FiCompass, label: 'Découvrir' },
    { to: '/home/matches', icon: FiHeart, label: 'Matchs' },
    { to: '/home/messages', icon: FiMessageCircle, label: 'Messages' },
  ];

  const primaryPhoto = user?.photos?.find((p) => p.isPrimary) || user?.photos?.[0];
  const avatarUrl = primaryPhoto?.url || user?.googlePhoto || 'https://placehold.co/150';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm w-full">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          
          <Link to="/home" className="text-xl md:text-2xl font-black bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent truncate select-none hover:opacity-80 transition-opacity">
            HAITZ-RENCONTRE
          </Link>

          <div className="hidden md:flex items-center flex-1 max-w-sm mx-6 relative">
            <div className="w-full relative group">
              <FiSearch className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${isSearching ? 'text-pink-500' : 'text-slate-400'}`} />
              <input 
                type="text" 
                placeholder="Rechercher des utilisateurs..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-100 border-2 border-transparent rounded-2xl pl-10 pr-10 py-2 focus:ring-4 focus:ring-pink-50 focus:bg-white focus:border-pink-300 transition-all outline-none font-medium text-slate-700"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500">
                  <FiX className="w-4 h-4" />
                </button>
              )}
            </div>

            {searchTerm.trim() && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-3 border-b border-slate-50 bg-slate-50/50">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Résultats de recherche</span>
                </div>
                {searchResults.length > 0 ? (
                  <div className="max-h-80 overflow-y-auto">
                    {searchResults.map(result => {
                      const resPhoto = result.photos?.find(p => p.isPrimary)?.url || result.googlePhoto || 'https://placehold.co/150';
                      return (
                        <Link 
                          key={result._id} 
                          to={`/home/profile/${result.username}`} 
                          onClick={() => setSearchTerm('')}
                          className="flex items-center gap-3 p-3 hover:bg-pink-50/50 transition-colors group"
                        >
                          <img src={resPhoto} alt="" className="w-10 h-10 rounded-full object-cover border border-slate-100" />
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 text-sm group-hover:text-pink-600 truncate">{result.firstName} {result.lastName}</p>
                            <p className="text-xs text-slate-400 font-medium">@{result.username}</p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : !isSearching && (
                  <div className="p-8 text-center text-slate-400 italic text-sm">Aucun utilisateur trouvé pour "{searchTerm}"</div>
                )}
                {isSearching && <div className="p-6 flex justify-center"><div className="w-5 h-5 border-2 border-pink-200 border-t-pink-500 rounded-full animate-spin"></div></div>}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 md:gap-4">
            <div className="hidden sm:flex items-center gap-1 mr-2">
              {nav.map(({ to, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `p-2.5 rounded-xl transition-all ${
                      isActive ? 'text-pink-600 bg-pink-50 shadow-inner' : 'text-slate-500 hover:text-pink-600 hover:bg-slate-50'
                    }`
                   }
                >
                  <Icon className="w-5 h-5 md:w-6 md:h-6" />
                </NavLink>
              ))}
            </div>

            <Link to="/home/notifications" className="p-2.5 text-slate-500 hover:bg-slate-50 rounded-xl relative transition-all">
              <FiBell className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-5 h-5 bg-rose-500 rounded-full border-2 border-white text-[10px] text-white font-black flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            <div className="relative">
              <button 
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 p-1 rounded-2xl border-2 border-transparent hover:border-pink-200 transition-all focus:outline-none"
              >
                <img src={avatarUrl} alt="Menu" className="w-10 h-10 rounded-full object-cover shadow-sm bg-white" />
              </button>

              {showDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)}></div>
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 z-20 py-2 animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-5 py-4 border-b border-slate-50 bg-slate-50/30">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Session active</p>
                      <p className="text-sm font-black text-slate-800 truncate">@{user?.username}</p>
                    </div>
                    <div className="p-2">
                       <Link onClick={() => setShowDropdown(false)} to={`/home/profile/${user?.username}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 rounded-xl text-slate-700 font-bold transition-all">
                        <FiUser className="w-4 h-4 text-pink-500" /> Mon profil
                      </Link>
                      {user?.role === 'admin' && (
                        <Link onClick={() => setShowDropdown(false)} to="/home/admin" className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 rounded-xl text-slate-700 font-bold transition-all">
                          <FiShield className="w-4 h-4 text-blue-500" /> Panel Admin
                        </Link>
                      )}
                      <Link onClick={() => setShowDropdown(false)} to="/home/profile/edit" className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 rounded-xl text-slate-700 font-bold transition-all">
                        <FiSettings className="w-4 h-4 text-slate-400" /> Paramètres
                      </Link>
                    </div>
                    <div className="border-t border-slate-100 mx-2 mt-2 pt-2 pb-2">
                      <button onClick={() => { setShowDropdown(false); handleLogout(); }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-rose-50 rounded-xl text-rose-600 font-black transition-all">
                        <FiLogOut className="w-4 h-4" /> Déconnexion
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 pb-16 md:pb-0 animate-in fade-in duration-700">
        <Outlet />
      </main>

      <nav className="sm:hidden fixed bottom-1 left-4 right-4 bg-white/90 backdrop-blur-xl border border-white/20 flex justify-around py-3 px-2 z-40 pb-[calc(env(safe-area-inset-bottom)+12px)] shadow-2xl rounded-[32px]">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 transition-all ${
                isActive ? 'text-pink-600 scale-110' : 'text-slate-400'
              }`
            }
          >
            <Icon className="w-6 h-6" />
            <span className="text-[10px] font-black uppercase tracking-tighter">{label}</span>
          </NavLink>
        ))}
        <NavLink to="/home/notifications" className={({ isActive }) => `flex flex-col items-center gap-1 transition-all ${isActive ? 'text-pink-600 scale-110' : 'text-slate-400'}`}>
          <div className="relative">
            <FiBell className="w-6 h-6" />
            {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white"></span>}
          </div>
          <span className="text-[10px] font-black uppercase tracking-tighter">Alertes</span>
        </NavLink>
      </nav>
    </div>
  );
}
