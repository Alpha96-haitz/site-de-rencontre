import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { FiLock, FiCheck, FiShield, FiAlertTriangle, FiArrowLeft } from 'react-icons/fi';
import client from '../api/client';
import logo from '../assets/logo.png';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [checkingToken, setCheckingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const checkToken = async () => {
      if (!token) {
        setTokenValid(false);
        setCheckingToken(false);
        return;
      }
      try {
        await client.get(`/auth/reset-password/validate?token=${encodeURIComponent(token)}`);
        setTokenValid(true);
      } catch {
        setTokenValid(false);
      } finally {
        setCheckingToken(false);
      }
    };
    checkToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tokenValid) return toast.error('Lien invalide');
    if (password.length < 6) return toast.error('Mot de passe trop court');
    if (password !== confirmPassword) return toast.error('Les mots de passe ne correspondent pas');

    setLoading(true);
    try {
      await client.post('/auth/reset-password', { token, password });
      setDone(true);
      toast.success('Mot de passe réinitialisé !');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors du reset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0a0a0a] font-sans selection:bg-pink-500 selection:text-white">
      {/* Background blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-pink-600/10 blur-[130px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-rose-600/10 blur-[130px] rounded-full" />
      </div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-lg mx-auto z-10 p-4"
      >
        <div className="backdrop-blur-3xl bg-white/5 border border-white/10 rounded-[2.5rem] shadow-2xl p-8 md:p-12 relative overflow-hidden text-center">
          
          <img src={logo} alt="HAITZ" className="h-20 object-contain mx-auto mb-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]" />

          {checkingToken ? (
            <div className="py-10 flex flex-col items-center gap-4">
               <div className="w-10 h-10 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin" />
               <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Vérification du lien...</p>
            </div>
          ) : done ? (
            <div className="space-y-8 animate-in fade-in zoom-in duration-500">
               <div className="w-20 h-20 bg-pink-500/20 rounded-full flex items-center justify-center mx-auto">
                  <FiCheck className="text-4xl text-pink-500" />
               </div>
               <h1 className="text-3xl font-black text-white">C'est fait !</h1>
               <p className="text-slate-500 text-sm">Votre mot de passe a été réinitialisé avec succès.</p>
               <button onClick={() => navigate('/login')} className="w-full py-5 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 text-white rounded-2xl font-black text-xl shadow-[0_15px_40px_rgba(244,63,94,0.4)] transition-all">
                  SE CONNECTER
               </button>
            </div>
          ) : !tokenValid ? (
            <div className="space-y-8">
               <div className="w-20 h-20 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto text-rose-500">
                  <FiAlertTriangle className="text-4xl" />
               </div>
               <h1 className="text-3xl font-black text-white">Lien invalide</h1>
               <p className="text-slate-500 text-sm italic">Ce lien de récupération a expiré ou a déjà été utilisé.</p>
               <button onClick={() => navigate('/forgot-password')} className="w-full py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                  <FiArrowLeft /> DEMANDER UN NOUVEAU LIEN
               </button>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Nouveau mot de passe</h1>
              <p className="text-slate-500 text-sm mb-10">Choisissez un secret que vous n'oublierez pas.</p>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="group relative">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-pink-500 transition-colors" />
                  <input 
                    type="password" 
                    placeholder="Mot de passe" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    className="w-full bg-white/5 border border-white/10 text-white pl-11 pr-4 py-4 rounded-2xl focus:border-pink-500 outline-none transition-all" 
                    required 
                  />
                </div>
                <div className="group relative">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-pink-500 transition-colors" />
                  <input 
                    type="password" 
                    placeholder="Confirmer mot de passe" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    className="w-full bg-white/5 border border-white/10 text-white pl-11 pr-4 py-4 rounded-2xl focus:border-pink-500 outline-none transition-all" 
                    required 
                  />
                </div>
                
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full py-5 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-2xl font-black text-lg shadow-[0_10px_30px_rgba(244,63,94,0.3)] hover:shadow-[0_15px_40px_rgba(244,63,94,0.4)] transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "RÉINITIALISER"}
                </button>
              </form>
            </>
          )}

          <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-center gap-2 text-slate-600 text-[10px] font-bold uppercase tracking-[0.2em]">
            <FiShield /> Système sécurisé par HAITZ
          </div>
        </div>
      </motion.div>
    </div>
  );
}
