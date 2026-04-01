import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

export default function EditProfile() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    bio: '',
    interests: '',
    ageRange: { min: 18, max: 99 }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        bio: user.bio || '',
        interests: Array.isArray(user.interests) ? user.interests.join(', ') : '',
        ageRange: user.ageRange || { min: 18, max: 99 }
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'ageMin' || name === 'ageMax') {
      setForm((f) => ({
        ...f,
        ageRange: { ...f.ageRange, [name === 'ageMin' ? 'min' : 'max']: parseInt(value) || 18 }
      }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await client.put('/users/profile', {
        ...form,
        interests: form.interests.split(',').map((s) => s.trim()).filter(Boolean)
      });
      await refreshUser();
      toast.success('Profil mis a jour');
      navigate('/profile');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('photo', file);
    try {
      await client.post('/users/photos', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      await refreshUser();
      toast.success('Photo ajoutee');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-slate-800 mb-4">Modifier le profil</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Photo</label>
          <input type="file" accept="image/*" onChange={handlePhotoUpload} className="w-full text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Bio</label>
          <textarea name="bio" value={form.bio} onChange={handleChange} rows={4} maxLength={500} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-pink-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Centres d'interet (separes par des virgules)</label>
          <input name="interests" value={form.interests} onChange={handleChange} placeholder="musique, voyage, cuisine..." className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-pink-500" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Age min</label>
            <input name="ageMin" type="number" min={18} max={99} value={form.ageRange?.min} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-slate-300" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Age max</label>
            <input name="ageMax" type="number" min={18} max={99} value={form.ageRange?.max} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-slate-300" />
          </div>
        </div>
        <button type="submit" disabled={loading} className="w-full py-3 bg-pink-600 text-white rounded-xl font-medium hover:bg-pink-700 disabled:opacity-50">
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </form>
    </div>
  );
}
