import { useState, useEffect } from 'react';
import client from '../api/client';
import { FiUsers, FiUserX, FiShield, FiTrendingUp, FiActivity, FiSearch, FiFlag, FiCheckCircle, FiAlertCircle, FiClock, FiTrash2, FiMail } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function Admin() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({ users: 0, online: 0, matches: 0, reports: 0, messages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'reports'
  const [notificationModal, setNotificationModal] = useState(null); // reportId or null
  const [notificationMessage, setNotificationMessage] = useState('');

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

  const handleSendNotification = async (reportId) => {
    if (!notificationMessage.trim()) {
      toast.error("Le message ne peut pas être vide");
      return;
    }

    try {
      await client.post(`/admin/reports/${reportId}/notify`, {
        message: notificationMessage
      });
      toast.success("Notification envoyée à l'utilisateur");
      setNotificationModal(null);
      setNotificationMessage('');
      fetchAdminData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur envoi notification");
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Supprimer definitivement cet utilisateur ?")) return;
    try {
      await client.delete(`/admin/users/${id}`);
      toast.success("Utilisateur supprime");
      fetchAdminData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur suppression utilisateur");
    }
  };

  const filteredUsers = users.filter(u => 
    u.firstName?.toLowerCase().includes(search.toLowerCase()) || 
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-20 text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] animate-pulse dark:bg-[#0b1220]">
       <FiShield className="text-6xl text-pink-100 mb-6 dark:text-pink-900/30" />
       Chargement Panel Admin...
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-20 dark:bg-[#0b1220]">
      {/* Header Panel */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4 shadow-sm dark:bg-[#111827] dark:border-slate-800">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg dark:bg-pink-600"><FiShield className="text-2xl" /></div>
             <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight dark:text-white">Espace Modération</h1>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Haitz-Social Admin Panel</p>
             </div>
          </div>

          <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100 dark:bg-slate-800 dark:border-slate-700">
             <button onClick={() => setActiveTab('users')} className={`px-6 py-2 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-400 hover:text-slate-600'}`}>Utilisateurs</button>
             <button onClick={() => setActiveTab('reports')} className={`px-6 py-2 rounded-xl text-sm font-black uppercase tracking-widest transition-all relative ${activeTab === 'reports' ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-400 hover:text-slate-600'}`}>
                Signalements
                {reports.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white">{reports.length}</span>}
             </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-10">
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          {[
            { label: 'Population', val: stats.users, icon: FiUsers, color: 'indigo' },
            { label: 'En ligne', val: stats.online, icon: FiActivity, color: 'emerald' },
            { label: 'Matches', val: stats.matches, icon: FiTrendingUp, color: 'pink' },
            { label: 'Alertes', val: stats.reports, icon: FiFlag, color: 'rose' }
          ].map((s, i) => (
            <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-5 dark:bg-[#111827] dark:border-slate-800/50 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-500 group">
               <div className={`w-14 h-14 bg-${s.color}-50 rounded-2xl flex items-center justify-center text-${s.color}-600 dark:bg-${s.color}-900/20 dark:text-${s.color}-400 group-hover:scale-110 transition-transform duration-500`}>
                 <s.icon className="w-6 h-6" />
               </div>
               <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                 <p className="text-2xl font-black text-slate-900 leading-tight dark:text-white tracking-tighter">{s.val}</p>
               </div>
            </div>
          ))}
        </div>

        {activeTab === 'users' ? (
           <div className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                 <h2 className="text-2xl font-black text-slate-900 tracking-tight dark:text-white">Liste des membres</h2>
                 <div className="relative">
                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Chercher..." 
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-pink-50 outline-none w-full md:w-80 shadow-sm transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    />
                 </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-5 dark:bg-slate-900 dark:border-slate-800">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50/50 border-b border-slate-100 dark:bg-slate-800/50 dark:border-slate-700">
                      <tr>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Membre</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date Adhésion</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                      {filteredUsers.map(u => (
                        <tr key={u._id} className="hover:bg-slate-50/30 transition-colors dark:hover:bg-slate-800/30">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <img src={u.photos?.find(p => p.isPrimary)?.url || u.googlePhoto || 'https://placehold.co/100'} alt="" className="w-10 h-10 rounded-xl object-cover ring-2 ring-slate-50 shadow-sm dark:ring-slate-800" />
                              <div>
                                <p className="font-black text-slate-800 text-sm leading-tight dark:text-white">{u.firstName} {u.lastName}</p>
                                <p className="text-[11px] text-pink-600 font-bold dark:text-pink-400">@{u.username}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                             <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${u.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-600'}`}></span>
                                <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${u.isBanned ? 'bg-rose-50 text-rose-500 border border-rose-100 dark:bg-rose-900/20 dark:border-rose-900/40' : 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-900/40'}`}>
                                  {u.isBanned ? 'Banni' : 'Actif'}
                                </span>
                             </div>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-500 font-bold dark:text-slate-400">{new Date(u.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                          <td className="px-6 py-4 text-right">
                             <div className="flex items-center justify-end gap-2">
                                <button onClick={() => handleBan(u._id, u.isBanned)} className={`p-2.5 rounded-xl transition-all shadow-sm ${u.isBanned ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-50 text-rose-500 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                                   {u.isBanned ? <FiCheckCircle className="w-5 h-5" /> : <FiUserX className="w-5 h-5" />}
                                </button>
                                {user?.role === 'root' && u.role !== 'root' && (
                                  <button onClick={() => handleDeleteUser(u._id)} className="p-2.5 rounded-xl transition-all shadow-sm bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700">
                                     <FiTrash2 className="w-5 h-5" />
                                  </button>
                                )}
                             </div>
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
              <h2 className="text-2xl font-black text-slate-900 tracking-tight dark:text-white">Signalements en attente</h2>
              {reports.length === 0 ? (
                 <div className="bg-white p-20 text-center rounded-3xl border border-slate-100 shadow-sm dark:bg-slate-900 dark:border-slate-800">
                    <FiCheckCircle className="w-16 h-16 text-emerald-100 mx-auto mb-4" />
                    <p className="text-slate-500 font-bold">Aucun signalement à traiter.</p>
                 </div>
              ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {reports.map((r) => (
                       <div key={r._id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all dark:bg-slate-900 dark:border-slate-800">
                          <div className="flex items-center justify-between mb-6">
                             <div className="flex items-center gap-2 text-rose-600 font-black uppercase text-[10px] tracking-widest bg-rose-50 px-3 py-1.5 rounded-full border border-rose-100 dark:bg-rose-900/20 dark:border-rose-900/40">
                                <FiAlertCircle /> Urgent
                             </div>
                             <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-tight">
                                <FiClock /> il y a 2h
                             </div>
                          </div>

                          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl mb-6 dark:bg-slate-800">
                             <img src={r.reportedUser?.photos?.[0]?.url || 'https://placehold.co/100'} alt="" className="w-14 h-14 rounded-xl object-cover ring-2 ring-white shadow-sm dark:ring-slate-700" />
                             <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cible</p>
                                <p className="font-black text-slate-800 text-[17px] leading-tight dark:text-white">{r.reportedUser?.firstName} {r.reportedUser?.lastName}</p>
                                <p className="text-xs text-rose-500 font-bold dark:text-rose-400">@{r.reportedUser?.username}</p>
                             </div>
                          </div>

                          <div className="space-y-4 mb-8">
                             <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Raison du signalement</p>
                                <div className="p-4 bg-white border border-slate-100 rounded-2xl text-[15px] text-slate-800 font-bold leading-relaxed italic dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200">
                                   "{r.reason}"
                                   {r.description && <p className="text-sm font-medium mt-2 not-italic opacity-70">— {r.description}</p>}
                                </div>
                             </div>
                             <p className="text-xs font-bold text-slate-400 px-1">Signalé par : <span className="text-slate-900 font-black dark:text-white">{r.reporter?.firstName} {r.reporter?.lastName}</span></p>
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-50 dark:border-slate-800">
                             <button onClick={() => handleReportAction(r._id, 'dismissed', false)} className="flex items-center justify-center gap-2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest transition-all dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700">Classer</button>
                             <button onClick={() => handleReportAction(r._id, 'action_taken', true)} className="flex items-center justify-center gap-2 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-rose-100 dark:shadow-none">Bannir</button>
                             <button onClick={() => setNotificationModal(r._id)} className="col-span-2 flex items-center justify-center gap-2 py-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border border-blue-100 dark:bg-blue-900/20 dark:border-blue-900/40 dark:text-blue-400">
                               <FiMail className="w-4 h-4" /> Envoyer une notification
                             </button>
                          </div>
                       </div>
                    ))}
                 </div>
              )}
           </div>
        )}

      </div>

      {/* Notification Modal */}
      {notificationModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 animate-in fade-in scale-in-95 dark:bg-slate-900 dark:border dark:border-slate-800">
            <h3 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2 dark:text-white">
              <FiMail className="text-blue-600 w-5 h-5" /> Envoyer une notification
            </h3>
            <p className="text-sm text-slate-600 mb-4 dark:text-slate-400">
              Composez un message pour informer l'utilisateur concernant votre décision.
            </p>
            <textarea
              value={notificationMessage}
              onChange={(e) => setNotificationMessage(e.target.value)}
              placeholder="Saisissez votre message ici..."
              className="w-full p-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-50 outline-none mb-4 resize-none h-32 text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-white"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setNotificationModal(null);
                  setNotificationMessage('');
                }}
                className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-sm uppercase tracking-widest transition-all dark:bg-slate-800 dark:text-slate-400"
              >
                Annuler
              </button>
              <button
                onClick={() => handleSendNotification(notificationModal)}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm uppercase tracking-widest transition-all shadow-lg shadow-blue-100 dark:shadow-none"
              >
                Envoyer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
