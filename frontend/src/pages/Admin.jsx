import { useState, useEffect } from 'react';
import client from '../api/client';
import { FiUsers, FiUserX, FiShield, FiTrendingUp, FiActivity, FiSearch } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ total: 0, online: 0, matches: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchAdminData = async () => {
    try {
      const { data } = await client.get('/admin/users');
      setUsers(data);
      // Stats simulées pour l'exemple (à brancher sur une API réelle si besoin)
      setStats({
        total: data.length,
        online: data.filter(u => u.isOnline).length,
        matches: Math.floor(data.length * 1.5)
      });
    } catch (err) {
      toast.error("Accès refusé ou erreur serveur");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleBan = async (id) => {
    if (!window.confirm("Bannir cet utilisateur ?")) return;
    try {
      await client.put(`/admin/users/${id}/ban`, { duration: 30 }); // 30 jours
      toast.success("Utilisateur banni");
      fetchAdminData();
    } catch (err) {
      toast.error("Erreur action admin");
    }
  };

  const filteredUsers = users.filter(u => 
    u.firstName.toLowerCase().includes(search.toLowerCase()) || 
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="p-12 text-center font-bold">Chargement Panel Admin...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
             <FiShield className="text-pink-600" /> Administration
          </h1>
          <p className="text-slate-500 font-medium">Gérez la communauté et surveillez l'activité.</p>
        </div>
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Rechercher un utilisateur..." 
            value={search}
            onChange={(e) => setSearch(search)}
            className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-200 outline-none w-full md:w-64"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
           <div className="w-12 h-12 bg-pink-50 rounded-2xl flex items-center justify-center text-pink-600"><FiUsers className="w-6 h-6" /></div>
           <div><p className="text-xs font-black text-slate-400 uppercase">Utilisateurs</p><p className="text-2xl font-black text-slate-900">{stats.total}</p></div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
           <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600"><FiActivity className="w-6 h-6" /></div>
           <div><p className="text-xs font-black text-slate-400 uppercase">En ligne</p><p className="text-2xl font-black text-slate-900">{stats.online}</p></div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
           <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600"><FiTrendingUp className="w-6 h-6" /></div>
           <div><p className="text-xs font-black text-slate-400 uppercase">Matchs</p><p className="text-2xl font-black text-slate-900">{stats.matches}</p></div>
        </div>
      </div>

      {/* Table Utilisateurs */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">Utilisateur</th>
              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">Email</th>
              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">Date Inscription</th>
              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">Status</th>
              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredUsers.map(u => (
              <tr key={u._id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img src={u.photos?.find(p => p.isPrimary)?.url || u.googlePhoto || 'https://placehold.co/100'} alt="" className="w-9 h-9 rounded-full object-cover" />
                    <div><p className="font-bold text-slate-800 text-sm">{u.firstName} {u.lastName}</p><p className="text-xs text-slate-500">@{u.username}</p></div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 font-medium">{u.email}</td>
                <td className="px-6 py-4 text-sm text-slate-600 font-medium">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                   <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${u.isBanned ? 'bg-rose-100 text-rose-600' : 'bg-green-100 text-green-600'}`}>
                     {u.isBanned ? 'Banni' : 'Actif'}
                   </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleBan(u._id)} className="p-2 text-rose-500 hover:bg-rose-100 rounded-xl transition-all" title="Bannir">
                      <FiUserX className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
