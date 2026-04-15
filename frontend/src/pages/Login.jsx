import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { FiArrowLeft, FiMail, FiLock, FiLogIn } from 'react-icons/fi';
import logo from '../assets/logo.png';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Bon retour parmi nous !');
      navigate('/home');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Identifiants invalides');
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
        transition={{ duration: 0.6 }}
        className="w-full max-w-lg mx-auto z-10 p-4"
      >
        <div className="backdrop-blur-3xl bg-white/5 border border-white/10 rounded-[2.5rem] shadow-2xl p-8 md:p-12 relative overflow-hidden">
          
          {/* Header Link */}
          <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-all font-bold text-xs uppercase tracking-widest mb-10 group">
             <FiArrowLeft className="text-lg group-hover:-translate-x-1 transition-transform" /> Accueil
          </Link>

          <div className="text-center mb-12">
             <img src={logo} alt="HAITZ" className="h-20 object-contain mx-auto mb-8 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
             <h1 className="text-3xl font-black text-white tracking-tight mb-2">Bon retour !</h1>
             <p className="text-slate-500 text-sm">Entrez vos identifiants pour vous connecter.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="group relative">
              <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-pink-500 transition-colors" />
              <input 
                type="email"
                placeholder="Adresse e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white pl-11 pr-4 py-4 rounded-2xl focus:border-pink-500 outline-none transition-all placeholder:text-slate-600"
                required
              />
            </div>

            <div className="group relative">
              <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-pink-500 transition-colors" />
              <input 
                type="password"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white pl-11 pr-4 py-4 rounded-2xl focus:border-pink-500 outline-none transition-all placeholder:text-slate-600"
                required
              />
            </div>

            <div className="text-right">
              <Link to="/forgot-password" size="sm" className="text-xs font-bold text-slate-500 hover:text-pink-500 uppercase tracking-widest transition-colors">
                Mot de passe oublié ?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-2xl font-black text-lg shadow-[0_10px_30px_rgba(244,63_94,0.3)] hover:shadow-[0_15px_40px_rgba(244,63_94,0.4)] transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 mt-4"
            >
              {loading ? <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>SE CONNECTER <FiLogIn /></>}
            </button>
          </form>

          <p className="mt-12 text-center text-slate-500 text-sm font-medium">
            Nouveau sur Haitz ? <Link to="/signup" className="text-pink-500 font-bold hover:text-pink-400 transition-colors hover:underline underline-offset-4 decoration-2">Créer un compte</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
