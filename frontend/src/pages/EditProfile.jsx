import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiBell, FiCamera, FiTrash2, FiLock, FiUserX, FiSave, FiArrowLeft, FiMapPin, FiUser, FiImage, FiBriefcase, FiInfo, FiShield, FiChevronRight, FiPlus, FiMoon, FiSun } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import client from '../api/client';

export default function EditProfile() {
  const { user, refreshUser, logout } = useAuth();
  const { theme, isDark, setTheme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [coverLoading, setCoverLoading] = useState(false);
  const [primaryLoadingId, setPrimaryLoadingId] = useState('');
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState(searchParams.get('tab') || 'general'); // 'general', 'photos', 'security', 'notifications'
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    push: true,
    marketing: false,
  });
  const [privacySettings, setPrivacySettings] = useState({
    showOnlineStatus: true,
    profileVisibility: 'public',
    allowMessagesFrom: 'matches'
  });
  
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    age: '',
    gender: 'other',
    bio: '',
    location: { city: '' },
    interests: '',
    ageRange: { min: 18, max: 99 }
  });

  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        age: user.age || '',
        gender: user.gender || 'other',
        bio: user.bio || '',
        location: { city: user.location?.city || '' },
        interests: Array.isArray(user.interests) ? user.interests.join(', ') : '',
        ageRange: user.ageRange || { min: 18, max: 99 }
      });
      setNotificationSettings({
        email: user.notificationPreferences?.email ?? true,
        push: user.notificationPreferences?.push ?? true,
        marketing: user.notificationPreferences?.marketing ?? false
      });
      setPrivacySettings({
        showOnlineStatus: user.privacy?.showOnlineStatus ?? true,
        profileVisibility: user.privacy?.profileVisibility ?? 'public',
        allowMessagesFrom: user.privacy?.allowMessagesFrom ?? 'matches'
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'city') {
      setForm(f => ({ ...f, location: { ...f.location, city: value } }));
    } else if (name === 'ageMin' || name === 'ageMax') {
      setForm((f) => ({
        ...f,
        ageRange: { ...f.ageRange, [name === 'ageMin' ? 'min' : 'max']: parseInt(value) || 18 }
      }));
    } else if (name === 'age') {
      setForm((f) => ({ ...f, age: value.replace(/[^\d]/g, '') }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const handlePasswordChangeInput = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const ageValue = parseInt(form.age, 10);
      const now = new Date();
      const birthDate = !Number.isNaN(ageValue) && ageValue > 0
        ? new Date(now.getFullYear() - ageValue, now.getMonth(), now.getDate())
        : undefined;

      const payload = {
        ...form,
        interests: form.interests.split(',').map((s) => s.trim()).filter(Boolean)
      };
      if (birthDate) {
        payload.birthDate = birthDate.toISOString();
      }

      await client.put('/users/profile', payload);
      await refreshUser();
      toast.success('Profil mis à jour');
    } catch (err) {
      console.error("Update error:", err);
      const errorMsg = err.response?.data?.errors?.[0]?.msg || 
                      err.response?.data?.message || 
                      'Erreur lors de la mise à jour';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoLoading(true);
    const fd = new FormData();
    fd.append('photo', file);
    try {
      await client.post('/users/photos', fd, { timeout: 60000 });
      await refreshUser();
      toast.success('Photo ajoutée');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'upload');
    } finally {
      setPhotoLoading(false);
    }
  };
  
  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverLoading(true);
    const fd = new FormData();
    fd.append('photo', file);
    try {
      await client.post('/users/cover', fd);
      await refreshUser();
      toast.success('Photo de couverture mise à jour');
    } catch (err) {
      toast.error('Erreur lors de l\'upload de la couverture');
    } finally {
      setCoverLoading(false);
    }
  };

  const handleDeletePhoto = async (publicId) => {
    if (!window.confirm("Supprimer cette photo ?")) return;
    try {
      await client.delete(`/users/photos/${encodeURIComponent(publicId)}`);
      await refreshUser();
      toast.success('Photo supprimée');
    } catch (err) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleSetPrimaryPhoto = async (publicId) => {
    setPrimaryLoadingId(publicId);
    try {
      await client.put(`/users/photos/${encodeURIComponent(publicId)}/primary`);
      await refreshUser();
      toast.success('Photo de profil mise ?? jour');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la mise ?? jour');
    } finally {
      setPrimaryLoadingId('');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return toast.error("Les mots de passe ne correspondent pas");
    }
    setLoading(true);
    try {
      await client.put('/users/change-password', {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword
      });
      toast.success("Mot de passe modifié");
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSettingsLoading(true);
    try {
      await client.put('/users/profile', {
        privacy: privacySettings,
        notificationPreferences: notificationSettings
      });
      await refreshUser();
      toast.success('Préférences sauvegardées');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Impossible de sauvegarder les paramètres');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Cette action est irréversible et supprimera toutes vos données.")) return;
    const confirmText = window.prompt("Tapez 'SUPPRIMER' pour confirmer");
    if (confirmText !== 'SUPPRIMER') return;
    try {
      await client.delete('/users/delete-account');
      toast.success("Compte supprimé.");
      logout();
      navigate('/');
    } catch (err) {
      toast.error("Erreur lors de la suppression");
    }
  };

  return (
    <div className="bg-[#f0f2f5] min-h-screen">
      {/* Header Bar */}
      <div className="bg-white shadow-sm h-16 flex items-center px-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
            <div className="flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                    <FiArrowLeft className="w-5 h-5 text-slate-600" />
                </button>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">Paramètres</h1>
            </div>
            <div className="flex items-center gap-2">
                <img src={user?.photos?.[0]?.url || user?.googlePhoto || 'https://placehold.co/100'} alt="" className="w-8 h-8 rounded-full border border-slate-200" />
                <span className="font-bold text-sm text-slate-700 hidden sm:inline">{user?.firstName} {user?.lastName}</span>
            </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 flex flex-col md:flex-row gap-6 mt-4">
        
        {/* Sidebar Navigation */}
        <div className="w-full md:w-80 shrink-0 space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden sticky top-24">
                <div className="p-4 border-b border-slate-100 flex items-center gap-3">
                   <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center text-pink-600"><FiUser className="text-xl" /></div>
                   <div>
                      <p className="font-black text-slate-900 leading-tight">Votre Compte</p>
                      <p className="text-[12px] text-slate-500 font-bold uppercase tracking-widest">Gérer vos infos</p>
                   </div>
                </div>
                <nav className="p-2">
                    {[
                        { id: 'general', label: 'Profil et informations', icon: FiUser },
                        { id: 'photos', label: 'Photos et couverture', icon: FiImage },
                        { id: 'security', label: 'Mot de passe et sécurité', icon: FiLock },
                        { id: 'notifications', label: 'Notifications', icon: FiBell },
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => {
                              setActiveSettingsTab(tab.id);
                              navigate(`/home/profile/edit?tab=${tab.id}`);
                            }}
                            className={`w-full flex items-center justify-between p-3 rounded-lg transition-all font-bold ${activeSettingsTab === tab.id ? 'bg-pink-50 text-pink-600' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            <div className="flex items-center gap-3">
                                <tab.icon className="text-xl" />
                                <span className="text-[15px]">{tab.label}</span>
                            </div>
                            <FiChevronRight className={`transition-transform ${activeSettingsTab === tab.id ? 'rotate-90' : ''}`} />
                        </button>
                    ))}
                    <div className="my-2 h-[1px] bg-slate-100"></div>
                    <button onClick={handleDeleteAccount} className="w-full flex items-center gap-3 p-3 rounded-lg text-rose-500 hover:bg-rose-50 font-bold transition-all">
                        <FiUserX className="text-xl" />
                        <span className="text-[15px]">Supprimer le compte</span>
                    </button>
                </nav>
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 space-y-6">
            
            {activeSettingsTab === 'general' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-xl font-black text-slate-900 mb-6 pb-2 border-b border-slate-50">Informations publiques</h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Prénom</label>
                                    <input name="firstName" value={form.firstName} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-pink-100 transition-all outline-none font-bold text-slate-800" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nom</label>
                                    <input name="lastName" value={form.lastName} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-pink-100 transition-all outline-none font-bold text-slate-800" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Age</label>
                                <input
                                  type="number"
                                  min="18"
                                  max="120"
                                  name="age"
                                  value={form.age}
                                  onChange={handleChange}
                                  placeholder="Ex: 28"
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-pink-100 transition-all outline-none font-bold text-slate-800"
                                />
                            </div>
                                                        <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Genre</label>
                                <select
                                  name="gender"
                                  value={form.gender}
                                  onChange={handleChange}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-pink-100 transition-all outline-none font-bold text-slate-800"
                                >
                                  <option value="male">Homme</option>
                                  <option value="female">Femme</option>
                                  <option value="other">Autre</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Bio (Ma présentation)</label>
                                <textarea name="bio" value={form.bio} onChange={handleChange} rows={4} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-pink-100 transition-all outline-none font-bold text-slate-800 resize-none" placeholder="Décrivez-vous..." />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Ville</label>
                                <div className="relative">
                                    <FiMapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input name="city" value={form.location.city} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 focus:bg-white focus:ring-2 focus:ring-pink-100 transition-all outline-none font-bold text-slate-800" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Intérêts (séparés par des virgules)</label>
                                <input name="interests" value={form.interests} onChange={handleChange} placeholder="Sport, Musique, Cuisine..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-pink-100 transition-all outline-none font-bold text-slate-800" />
                            </div>
                            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-4 bg-pink-600 text-white rounded-xl font-black hover:bg-pink-700 transition-all shadow-lg shadow-pink-100 active:scale-95 disabled:opacity-50">
                                <FiSave className="text-xl" /> {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {activeSettingsTab === 'photos' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6">
                    {/* Cover Management */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                            <FiImage className="text-pink-500" /> Photo de Couverture
                        </h2>
                        <div className="relative h-48 md:h-64 rounded-xl overflow-hidden bg-slate-100 group border border-slate-100">
                            {user?.coverPicture ? (
                                <img src={user.coverPicture} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                                    <FiImage className="text-5xl mb-2 opacity-20" />
                                    <p className="text-xs font-black uppercase tracking-widest">Aucune couverture</p>
                                </div>
                            )}
                            <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer">
                                <span className="bg-white text-slate-900 px-4 py-2 rounded-lg font-black text-sm flex items-center gap-2"><FiCamera /> Changer</span>
                                <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" disabled={coverLoading} />
                            </label>
                            {coverLoading && <div className="absolute inset-0 bg-white/60 flex items-center justify-center"><div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div></div>}
                        </div>
                    </div>

                    {/* Gallery Management */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                            <FiCamera className="text-pink-500" /> Votre Galerie
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                            {user?.photos?.map(photo => (
                                <div key={photo.publicId} className="relative aspect-square rounded-xl overflow-hidden group border border-slate-100 shadow-sm">
                                    <img src={photo.url} alt="" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                                        {!photo.isPrimary && (
                                          <button
                                            onClick={() => handleSetPrimaryPhoto(photo.publicId)}
                                            disabled={primaryLoadingId === photo.publicId}
                                            className="bg-emerald-500 text-white p-2.5 rounded-lg hover:scale-110 active:scale-95 transition-all shadow-lg disabled:opacity-60"
                                            title="Definir comme photo de profil"
                                          >
                                            {primaryLoadingId === photo.publicId ? '...' : <FiUser />}
                                          </button>
                                        )}
                                        <button onClick={() => handleDeletePhoto(photo.publicId)} className="bg-rose-500 text-white p-2.5 rounded-lg hover:scale-110 active:scale-95 transition-all shadow-lg"><FiTrash2 /></button>
                                    </div>
                                    {photo.isPrimary && <div className="absolute bottom-2 left-2 bg-pink-600 text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded shadow-sm">Photo de profil</div>}
                                </div>
                            ))}
                            <label className="aspect-square rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-50 hover:border-pink-300 transition-all group relative">
                                <div className="w-10 h-10 bg-slate-50 group-hover:bg-pink-100 rounded-full flex items-center justify-center transition-all"><FiPlus className="text-slate-400 group-hover:text-pink-600 text-xl" /></div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ajouter</span>
                                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={photoLoading} />
                                {photoLoading && <div className="absolute inset-0 bg-white/60 flex items-center justify-center"><div className="w-8 h-8 border-3 border-pink-600 border-t-transparent rounded-full animate-spin"></div></div>}
                            </label>
                        </div>
                    </div>
                </div>
            )}

            {activeSettingsTab === 'security' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6">
                    {/* Password Change Form */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                            <FiLock className="text-pink-500" /> Modifier le mot de passe
                        </h2>
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Ancien mot de passe</label>
                                    <input 
                                        type="password"
                                        name="oldPassword" 
                                        value={passwordForm.oldPassword} 
                                        onChange={handlePasswordChangeInput} 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-pink-100 transition-all outline-none font-bold text-slate-800" 
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nouveau mot de passe</label>
                                    <input 
                                        type="password"
                                        name="newPassword" 
                                        value={passwordForm.newPassword} 
                                        onChange={handlePasswordChangeInput} 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-pink-100 transition-all outline-none font-bold text-slate-800" 
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Confirmer</label>
                                    <input 
                                        type="password"
                                        name="confirmPassword" 
                                        value={passwordForm.confirmPassword} 
                                        onChange={handlePasswordChangeInput} 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-pink-100 transition-all outline-none font-bold text-slate-800"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>
                            <button type="submit" disabled={loading} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black hover:bg-slate-800 transition-all shadow-lg active:scale-95 disabled:opacity-50">
                                {loading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
                            </button>
                        </form>
                    </div>

                    {/* Privacy and Security Settings */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                            <FiShield className="text-blue-500" /> Confidentialité et sécurité
                        </h2>
                        <div className="space-y-5">
                            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 shadow-inner">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Visibilité de mon profil</label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                  {['public', 'matches', 'private'].map((v) => (
                                    <button
                                      key={v}
                                      onClick={() => setPrivacySettings(p => ({ ...p, profileVisibility: v }))}
                                      className={`p-3 rounded-xl border-2 font-black transition-all text-sm ${privacySettings.profileVisibility === v ? 'bg-pink-600 border-pink-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:border-pink-200'}`}
                                    >
                                      {v === 'public' ? 'Public' : v === 'matches' ? 'Matchs' : 'Privé'}
                                    </button>
                                  ))}
                                </div>
                                <p className="text-[12px] text-slate-400 font-bold mt-2 ml-1 italic">
                                  {privacySettings.profileVisibility === 'public' && "Tout le monde peut voir votre profil."}
                                  {privacySettings.profileVisibility === 'matches' && "Seuls les membres avec qui vous avez un match voient votre profil."}
                                  {privacySettings.profileVisibility === 'private' && "Votre profil n'apparaît pas dans la découverte."}
                                </p>
                            </div>

                            <div className="flex items-center justify-between p-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
                                <div>
                                    <p className="font-black text-slate-900">Statut en ligne</p>
                                    <p className="text-sm font-bold text-slate-400">Afficher si je suis actuellement connecté</p>
                                </div>
                                <button
                                  onClick={() => setPrivacySettings((prev) => ({ ...prev, showOnlineStatus: !prev.showOnlineStatus }))}
                                  className={`w-14 h-8 rounded-full transition-all relative ${privacySettings.showOnlineStatus ? 'bg-pink-600' : 'bg-slate-300'}`}
                                >
                                  <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-sm transition-all ${privacySettings.showOnlineStatus ? 'right-1' : 'left-1'}`} />
                                </button>
                            </div>

                            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 shadow-inner">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Conversations autorisées</label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                  {['everyone', 'matches', 'no-one'].map((v) => (
                                    <button
                                      key={v}
                                      onClick={() => setPrivacySettings(p => ({ ...p, allowMessagesFrom: v }))}
                                      className={`p-3 rounded-xl border-2 font-black transition-all text-sm ${privacySettings.allowMessagesFrom === v ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-200'}`}
                                    >
                                      {v === 'everyone' ? 'Public' : v === 'matches' ? 'Matchs' : 'Fermé'}
                                    </button>
                                  ))}
                                </div>
                                <p className="text-[12px] text-slate-400 font-bold mt-2 ml-1 italic">
                                  {privacySettings.allowMessagesFrom === 'everyone' && "Tout le monde peut vous envoyer un message."}
                                  {privacySettings.allowMessagesFrom === 'matches' && "Seuls vos matchs peuvent vous contacter."}
                                  {privacySettings.allowMessagesFrom === 'no-one' && "Personne ne peut initier de message."}
                                </p>
                            </div>

                            <div className="flex items-center justify-between p-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
                                <div>
                                    <p className="font-black text-slate-900">Mode Sombre</p>
                                    <p className="text-sm font-bold text-slate-400">Activer l'interface à thème sombre</p>
                                </div>
                                <button
                                  onClick={() => setTheme(isDark ? 'light' : 'dark')}
                                  className={`w-14 h-8 rounded-full transition-all relative ${isDark ? 'bg-slate-800' : 'bg-slate-300'}`}
                                >
                                  <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-sm transition-all ${isDark ? 'right-1' : 'left-1'}`} />
                                </button>
                            </div>

                            <button
                                onClick={handleSaveSettings}
                                disabled={settingsLoading}
                                className="w-full py-4 bg-pink-600 text-white rounded-xl font-black hover:bg-pink-700 transition-all shadow-xl shadow-pink-100 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <FiSave /> {settingsLoading ? 'Sauvegarde...' : 'Sauvegarder les préférences de sécurité'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeSettingsTab === 'notifications' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                            <FiBell className="text-pink-500" /> Notifications
                        </h2>
                        <p className="text-sm text-slate-500 mb-6">Gérez vos préférences de notification pour les messages, les matchs et les mises à jour.</p>
                        <div className="space-y-4">
                            {[
                                { key: 'email', label: 'Recevoir les notifications par email', description: 'Nouvelle activité, messages et alertes.' },
                                { key: 'push', label: 'Recevoir les notifications push', description: 'Alertes instantanées sur votre appareil.' },
                                { key: 'marketing', label: 'Offres et recommandations', description: 'Promotions et nouveautés personnalisées.' }
                            ].map(item => (
                                <div key={item.key} className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-slate-200 bg-slate-50">
                                    <div>
                                        <p className="font-bold text-slate-800">{item.label}</p>
                                        <p className="text-sm text-slate-500">{item.description}</p>
                                    </div>
                                    <button
                                        onClick={() => setNotificationSettings((prev) => ({
                                          ...prev,
                                          [item.key]: !prev[item.key]
                                        }))}
                                        className={`px-4 py-2 rounded-full font-bold transition-colors ${notificationSettings[item.key] ? 'bg-pink-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
                                    >
                                        {notificationSettings[item.key] ? 'Activé' : 'Désactivé'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

        </div>

      </div>
    </div>
  );
}
