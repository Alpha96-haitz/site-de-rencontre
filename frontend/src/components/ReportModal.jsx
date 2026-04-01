import { useState } from 'react';
import client from '../api/client';
import toast from 'react-hot-toast';

const REASONS = [
  { value: 'spam', label: 'Spam' },
  { value: 'harassment', label: 'Harcèlement' },
  { value: 'inappropriate', label: 'Contenu inapproprié' },
  { value: 'fake', label: 'Profil faux' },
  { value: 'other', label: 'Autre' }
];

export default function ReportModal({ userId, onClose }) {
  const [reason, setReason] = useState('spam');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await client.post('/reports', { reportedUserId: userId, reason, description });
      toast.success('Signalent enregistre');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-semibold text-lg mb-4">Signaler ce profil</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Raison</label>
            <select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-slate-300">
              {REASONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Details (optionnel)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full px-4 py-2 rounded-lg border border-slate-300" />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-slate-300 rounded-lg">Annuler</button>
            <button type="submit" disabled={loading} className="flex-1 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50">
              {loading ? '...' : 'Signaler'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
