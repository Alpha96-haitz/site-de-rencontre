import { useState } from 'react';
import { FiX, FiAlertTriangle, FiFlag, FiShield, FiSend } from 'react-icons/fi';
import toast from 'react-hot-toast';
import client from '../api/client';

export default function ReportModal({ reportedUserId, reportedUserName, onClose }) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) return toast.error("Veuillez choisir une raison");
    
    setLoading(true);
    try {
      await client.post('/reports', {
        reportedUserId,
        reason,
        description
      });
      toast.success("Signalement envoyé à l'équipe de modération.");
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur lors du signalement");
    } finally {
      setLoading(false);
    }
  };

  const reasons = [
    "Harcèlement ou intimidation",
    "Discours haineux ou injurieux",
    "Faux profil ou spam",
    "Contenu inapproprié ou sexuel",
    "Incite à la haine ou à la violence",
    "Autre"
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col items-center p-8 animate-in zoom-in-95 duration-500">
        
        <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-slate-50 hover:bg-slate-100 rounded-full transition-all text-slate-400">
           <FiX className="text-xl" />
        </button>

        <div className="w-20 h-20 bg-rose-50 rounded-[30px] flex items-center justify-center text-rose-600 mb-6 shadow-sm border border-rose-100">
           <FiFlag className="text-3xl" />
        </div>

        <h2 className="text-2xl font-black text-slate-900 tracking-tight text-center mb-2">Signaler {reportedUserName}</h2>
        <p className="text-slate-500 font-bold text-center text-sm mb-8 max-w-[280px]">Votre signalement est anonyme et sera traité par notre équipe de sécurité sous 24h.</p>

        <form onSubmit={handleSubmit} className="w-full space-y-6">
           <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Raison du signalement</label>
              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto px-1">
                 {reasons.map(r => (
                    <button 
                       key={r}
                       type="button"
                       onClick={() => setReason(r)}
                       className={`w-full text-left p-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border-2 ${reason === r ? 'bg-rose-50 border-rose-500 text-rose-600' : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100'}`}
                    >
                       {r}
                    </button>
                 ))}
              </div>
           </div>

           <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Complément (Facultatif)</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Détaillez votre signalement si nécessaire..."
                className="w-full bg-slate-50 border-2 border-transparent focus:border-rose-100 focus:bg-white rounded-2xl p-4 text-sm font-bold text-slate-800 outline-none resize-none transition-all"
                rows="3"
                maxLength={300}
              />
           </div>

           <div className="flex flex-col gap-3 pt-4">
              <button 
                type="submit" 
                disabled={loading || !reason}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white py-4 rounded-3xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-rose-100 active:scale-95 disabled:opacity-50 disabled:scale-100"
              >
                 {loading ? "Envoi..." : <span className="flex items-center justify-center gap-2"><FiSend /> Envoyer le rapport</span>}
              </button>
              <p className="text-[9px] text-slate-400 text-center font-bold px-6 leading-relaxed">HAITZ-SOCIAL protège la communauté. Tout abus de la fonction de signalement peut entraîner des sanctions.</p>
           </div>
        </form>
      </div>
    </div>
  );
}
