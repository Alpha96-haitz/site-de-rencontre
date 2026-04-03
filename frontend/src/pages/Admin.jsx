import { useState, useEffect } from 'react';
import client from '../api/client';
import { FiUsers, FiUserX, FiShield, FiTrendingUp, FiActivity, FiSearch, FiFlag, FiCheckCircle, FiAlertCircle, FiClock, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({ users: 0, online: 0, matches: 0, reports: 0, messages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'reports'

  const fetchAdminData = async () => {
    try {
      const [usersRes, statsRes, reportsRes] = await Promise.all([
        client.get('/admin/users'),
        client.get('/admin/stats'),
        client.get('/admin/reports')
      ]);
      
      setUsers(usersRes.data);
      setStats({
        ...statsRes.data,
        online: usersRes.data.filter(u => u.isOnline).length
      });
      setReports(reportsRes.data);
    } catch (err) {
      toast.error("Accès refusé ou erreur serveur");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleBan = async (id, isBanned) => {
    if (!window.confirm(isBanned ? "Débannir cet utilisateur ?" : "Bannir cet utilisateur ?")) return;
    try {
      if (isBanned) {
        await client.put(`/admin/users/${id}/unban`);
        toast.success("Utilisateur débanni");
      } else {
        await client.put(`/admin/users/${id}/ban`, { duration: 30 });
        toast.success("Utilisateur banni");
      }
      fetchAdminData();
    } catch (err) {
      toast.error("Erreur action admin");
    }
  };

  const handleReportAction = async (reportId, action, shouldBan) => {
    try {
      await client.put(`/admin/reports/${reportId}`, { action, banUser: shouldBan });
      toast.success("Signalement traité");
      fetchAdminData();
    } catch (err) {
      toast.error("Erreur traitement signalement");
    }
  };

  const filteredUsers = users.filter(u => 
    u.firstName?.toLowerCase().includes(search.toLowerCase()) || 
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-20 text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] animate-pulse">
       <FiShield className="text-6xl text-pink-100 mb-6" />
       Chargement Panel Admin...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      {/* Header Panel */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg"><FiShield className="text-2xl" /></div>
             <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Espace Modération</h1>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Haitz-Social Admin Panel</p>
             </div>
          </div>

          <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100">
             <button onClick={() => setActiveTab('users')} className={`px-6 py-2 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Utilisateurs</button>
             <button onClick={() => setActiveTab('reports')} className={`px-6 py-2 rounded-xl text-sm font-black uppercase tracking-widest transition-all relative ${activeTab === 'reports' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                Signalements
                {reports.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white">{reports.length}</span>}
             </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-10">
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
             <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600"><FiUsers className="w-5 h-5" /></div>
             <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Population</p><p className="text-xl font-black text-slate-900 leading-tight">{stats.users}</p></div>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
             <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600"><FiActivity className="w-5 h-5" /></div>
             <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">En ligne</p><p className="text-xl font-black text-slate-900 leading-tight">{stats.online}</p></div>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
             <div className="w-10 h-10 bg-pink-50 rounded-xl flex items-center justify-center text-pink-600"><FiTrendingUp className="w-5 h-5" /></div>
             <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Matches</p><p className="text-xl font-black text-slate-900 leading-tight">{stats.matches}</p></div>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
             <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600"><FiFlag className="w-5 h-5" /></div>
             <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alertes</p><p className="text-xl font-black text-slate-900 leading-tight">{stats.reports}</p></div>
          </div>
        </div>

        {activeTab === 'users' ? (
           <div className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                 <h2 className="text-2xl font-black text-slate-900 tracking-tight">Liste des membres</h2>
                 <div className="relative">
                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Chercher..." 
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-pink-50 outline-none w-full md:w-80 shadow-sm transition-all"
                    />
                 </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-5">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50/50 border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Membre</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date Adhésion</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredUsers.map(u => (
                        <tr key={u._id} className="hover:bg-slate-50/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <img src={u.photos?.find(p => p.isPrimary)?.url || u.googlePhoto || 'https://placehold.co/100'} alt="" className="w-10 h-10 rounded-xl object-cover ring-2 ring-slate-50 shadow-sm" />
                              <div>
                                <p className="font-black text-slate-800 text-sm leading-tight">{u.firstName} {u.lastName}</p>
                                <p className="text-[11px] text-pink-600 font-bold">@{u.username}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                             <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${u.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
                                <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${u.isBanned ? 'bg-rose-50 text-rose-500 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                                  {u.isBanned ? 'Banni' : 'Actif'}
                                </span>
                             </div>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-500 font-bold">{new Date(u.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                          <td className="px-6 py-4 text-right">
                             <button onClick={() => handleBan(u._id, u.isBanned)} className={`p-2.5 rounded-xl transition-all shadow-sm ${u.isBanned ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-rose-50 text-rose-500 hover:bg-rose-100'}`}>
                                {u.isBanned ? <FiCheckCircle className="w-5 h-5" /> : <FiUserX className="w-5 h-5" />}
                             </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
           </div>
        ) : (
           <div className="space-y-6">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Signalements en attente</h2>
              {reports.length === 0 ? (
                 <div className="bg-white p-20 text-center rounded-3xl border border-slate-100 shadow-sm">
                    <FiCheckCircle className="w-16 h-16 text-emerald-100 mx-auto mb-4" />
                    <p className="text-slate-500 font-bold">Aucun signalement à traiter.</p>
                 </div>
              ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {reports.map((r) => (
                       <div key={r._id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all">
                          <div className="flex items-center justify-between mb-6">
                             <div className="flex items-center gap-2 text-rose-600 font-black uppercase text-[10px] tracking-widest bg-rose-50 px-3 py-1.5 rounded-full border border-rose-100">
                                <FiAlertCircle /> Urgent
                             </div>
                             <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-tight">
                                <FiClock /> il y a 2h
                             </div>
                          </div>

                          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl mb-6">
                             <img src={r.reportedUser?.photos?.[0]?.url || 'https://placehold.co/100'} alt="" className="w-14 h-14 rounded-xl object-cover ring-2 ring-white shadow-sm" />
                             <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cible</p>
                                <p className="font-black text-slate-800 text-[17px] leading-tight">{r.reportedUser?.firstName} {r.reportedUser?.lastName}</p>
                                <p className="text-xs text-rose-500 font-bold">@{r.reportedUser?.username}</p>
                             </div>
                          </div>

                          <div className="space-y-4 mb-8">
                             <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Raison du signalement</p>
                                <div className="p-4 bg-white border border-slate-100 rounded-2xl text-[15px] text-slate-800 font-bold leading-relaxed italic">
                                   "{r.reason}"
                                   {r.description && <p className="text-sm font-medium mt-2 not-italic opacity-70">— {r.description}</p>}
                                </div>
                             </div>
                             <p className="text-xs font-bold text-slate-400 px-1">Signalé par : <span className="text-slate-900 font-black">{r.reporter?.firstName} {r.reporter?.lastName}</span></p>
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-50">
                             <button onClick={() => handleReportAction(r._id, 'dismissed', false)} className="flex items-center justify-center gap-2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest transition-all">Classer</button>
                             <button onClick={() => handleReportAction(r._id, 'action_taken', true)} className="flex items-center justify-center gap-2 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-rose-100">Bannir</button>
                          </div>
                       </div>
                    ))}
                 </div>
              )}
           </div>
        )}

      </div>
    </div>
  );
}
