import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { FiMail, FiRefreshCw, FiLogOut, FiCheckCircle, FiArrowLeft, FiShield } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import logo from '../assets/logo.png';

export default function VerifyEmailRequired() {
  const { user, logout, refreshVerificationStatus, isEmailVerified } = useAuth();
  const [checking, setChecking] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isEmailVerified) {
      navigate('/home', { replace: true });
    }
  }, [isEmailVerified, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const handleRefresh = async () => {
    setChecking(true);
    try {
      const isVerified = await refreshVerificationStatus();
      if (isVerified) {
        toast.success('Email vérifié ! Bienvenue.');
      } else {
        toast.error('L\'email n\'est pas encore validé.');
      }
    } catch (err) {
      toast.error('Erreur lors de la vérification.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0a0a0a] font-sans">
      {/* Background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-600/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-rose-600/20 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-md mx-auto z-10 p-4"
      >
        <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-[2.5rem] shadow-2xl p-8 md:p-12 text-center relative overflow-hidden">
          
          {/* Header Link */}
          <button 
            onClick={handleLogout}
            className="absolute top-8 left-8 p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-white"
          >
            <FiArrowLeft className="text-xl" />
          </button>
          
          <img src={logo} alt="HAITZ" className="h-20 object-contain mx-auto mb-10 mt-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
          
          <div className="w-24 h-24 bg-gradient-to-tr from-pink-500/20 to-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-8 relative">
            <div className="absolute inset-0 bg-pink-500/10 blur-xl rounded-full" />
            <FiMail className="w-12 h-12 text-pink-500 relative z-10" />
            <motion.div 
              animate={{ scale: [1, 1.2, 1] }} 
              transition={{ repeat: Infinity, duration: 2 }} 
              className="absolute -top-1 -right-1 w-6 h-6 bg-rose-500 rounded-full border-4 border-black" 
            />
          </div>

          <h1 className="text-3xl font-black text-white mb-4 tracking-tight">Vérifiez votre email</h1>
          <p className="text-slate-400 mb-10 leading-relaxed text-sm">
            Un lien de confirmation a été envoyé à <br />
            <span className="font-bold text-white text-base">@{user?.email}</span>.
            Validez pour activer votre compte.
          </p>

          <div className="space-y-4">
            <button 
              onClick={handleRefresh}
              disabled={checking}
              className="w-full py-5 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-2xl font-black text-lg shadow-[0_10px_30px_rgba(244,63,94,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {checking ? <FiRefreshCw className="animate-spin" /> : <FiCheckCircle className="text-xl" />}
              J'ai vérifié mon email
            </button>

            <button 
              onClick={handleLogout}
              className="w-full py-4 text-slate-500 font-bold uppercase tracking-widest text-xs hover:text-white transition-colors flex items-center justify-center gap-2"
            >
              <FiLogOut /> Se déconnecter
            </button>
          </div>

          <div className="mt-10 pt-8 border-t border-white/5">
            <div className="flex items-center justify-center gap-2 text-slate-600 text-[10px] font-bold uppercase tracking-[0.2em]">
              <FiShield /> Système sécurisé par HAITZ
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
