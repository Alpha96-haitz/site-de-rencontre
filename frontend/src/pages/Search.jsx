import { useState, useEffect, useCallback } from 'react';
import { FiSearch, FiUserPlus, FiUserCheck, FiFilter, FiMapPin } from 'react-icons/fi';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import debounce from 'lodash.debounce';

export default function Search() {
  const { user, refreshUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    gender: '',
    ageMin: '',
    ageMax: '',
    interests: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  const fetchResults = async (query = '', currentFilters = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: query,
        ...currentFilters
      });
      const { data } = await client.get(`/users/search?${params.toString()}`);
      setResults(data);
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la recherche");
    } finally {
      setLoading(false);
    }
  };

  // Debounced search for name
  const debouncedSearch = useCallback(
    debounce((q, f) => fetchResults(q, f), 500),
    []
  );

  useEffect(() => {
    fetchResults('', filters);
  }, []);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    debouncedSearch(val, filters);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    fetchResults(searchTerm, newFilters);
  };

  const toggleFollow = async (targetId, isFollowing) => {
    try {
      if (isFollowing) {
        await client.put(`/users/${targetId}/unfollow`);
        toast.success("Désabonné");
      } else {
        await client.put(`/users/${targetId}/follow`);
        toast.success("Abonné !");
      }
      await refreshUser();
      // Mettre à jour l'état local pour un feedback immédiat
      setResults(prev => prev.map(u => {
        if (u._id === targetId) {
          const newFollowers = isFollowing 
            ? u.followers.filter(id => id !== user._id)
            : [...(u.followers || []), user._id];
          return { ...u, followers: newFollowers };
        }
        return u;
      }));
    } catch (err) {
      toast.error("Action impossible");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 mb-2">Recherche</h1>
          <p className="text-slate-500 font-medium tracking-tight">Trouvez des personnes incroyables autour de vous.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-80">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Nom, @username..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full bg-white border border-slate-100 rounded-2xl py-3.5 pl-12 pr-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-100 transition-all font-medium"
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`p-3.5 rounded-2xl border transition-all ${showFilters ? 'bg-pink-600 border-pink-600 text-white shadow-lg shadow-pink-100' : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'}`}
          >
            <FiFilter className="w-5 h-5" />
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 mb-8 grid grid-cols-1 md:grid-cols-4 gap-4 animate-in slide-in-from-top-4 duration-300">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Genre</label>
            <select 
              name="gender" 
              value={filters.gender} 
              onChange={handleFilterChange}
              className="w-full bg-slate-50 border border-slate-50 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none"
            >
              <option value="">Tous</option>
              <option value="male">Hommes</option>
              <option value="female">Femmes</option>
              <option value="other">Autre</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Âge Min</label>
            <input 
              type="number" 
              name="ageMin"
              placeholder="18"
              value={filters.ageMin}
              onChange={handleFilterChange}
              className="w-full bg-slate-50 border border-slate-50 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Âge Max</label>
            <input 
              type="number" 
              name="ageMax"
              placeholder="99"
              value={filters.ageMax}
              onChange={handleFilterChange}
              className="w-full bg-slate-50 border border-slate-50 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Intérêts</label>
            <input 
              type="text" 
              name="interests"
              placeholder="Voyages, Musique..."
              value={filters.interests}
              onChange={handleFilterChange}
              className="w-full bg-slate-50 border border-slate-50 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none"
            />
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-20"><div className="w-12 h-12 border-4 border-pink-100 border-t-pink-600 rounded-full animate-spin"></div></div>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {results.map(res => {
            const isFollowing = user?.following?.includes(res._id) || res.followers?.includes(user?._id);
            const resPhoto = res.photos?.find(p => p.isPrimary)?.url || res.googlePhoto || 'https://placehold.co/300x400?text=Profil';
            
            return (
              <div key={res._id} className="group bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-300">
                <Link to={`/home/profile/${res.username}`} className="block relative h-64 overflow-hidden">
                  <img src={resPhoto} alt={res.firstName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="absolute bottom-3 left-3 text-white">
                    <p className="text-xs font-black uppercase tracking-widest flex items-center gap-1"><FiMapPin className="w-3 h-3"/> {res.location?.city || 'Près de vous'}</p>
                  </div>
                </Link>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <Link to={`/home/profile/${res.username}`} className="text-lg font-black text-slate-800 hover:text-pink-600 transition-colors">{res.firstName}, {res.age}</Link>
                      <p className="text-xs text-slate-400 font-bold tracking-tight">@{res.username}</p>
                    </div>
                    <button 
                      onClick={() => toggleFollow(res._id, isFollowing)}
                      className={`p-2.5 rounded-2xl transition-all ${isFollowing ? 'bg-slate-100 text-slate-600' : 'bg-pink-600 text-white shadow-lg shadow-pink-100 hover:scale-110'}`}
                    >
                      {isFollowing ? <FiUserCheck className="w-5 h-5" /> : <FiUserPlus className="w-5 h-5" />}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {res.interests?.slice(0, 3).map(i => (
                      <span key={i} className="px-2 py-0.5 bg-slate-50 text-[9px] font-black uppercase tracking-widest text-slate-400 rounded-lg">{i}</span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 px-8 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
           <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100">
             <FiSearch className="w-10 h-10 text-slate-200" />
           </div>
           <h3 className="text-xl font-bold text-slate-800 mb-2">Aucun résultat</h3>
           <p className="text-slate-500 max-w-xs mx-auto">Essayez d'ajuster vos filtres ou de modifier votre recherche.</p>
        </div>
      )}
    </div>
  );
}
