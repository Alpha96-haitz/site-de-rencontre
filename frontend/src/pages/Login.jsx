import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import GoogleLoginButton from '../components/GoogleLoginButton';

import { FiArrowLeft, FiShield } from 'react-icons/fi';
import logo from '../assets/logo.png';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Connexion réussie');
      navigate('/home');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credential) => {
    setLoading(true);
    try {
      await loginWithGoogle(credential);
      toast.success('Connexion réussie');
      navigate('/home');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur de connexion Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-rose-100 p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 relative overflow-hidden">
        
        {/* Back Link */}
        <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-pink-600 transition-all font-bold text-xs uppercase tracking-widest mb-8">
           <FiArrowLeft className="text-lg" /> Retour à l'accueil
        </Link>

        <div className="text-center mb-8">
           <img src={logo} alt="HAITZ" className="h-24 md:h-32 object-contain mx-auto mb-4" />
           <p className="text-slate-500 font-bold">Connectez-vous à votre compte</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              required
            />
          </div>
          <Link to="/forgot-password" className="text-sm text-pink-600 hover:underline block">
            Mot de passe oublié ?
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-pink-600 text-white rounded-lg font-medium hover:bg-pink-700 disabled:opacity-50"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-500">ou</span>
            </div>
          </div>
          <GoogleLoginButton
            onSuccess={handleGoogleSuccess}
            onError={() => toast.error('Connexion Google annulée')}
            disabled={loading}
          />
        </form>
        <p className="mt-4 text-center text-slate-600">
          Pas de compte ? <Link to="/signup" className="text-pink-600 font-medium hover:underline">S'inscrire</Link>
        </p>
      </div>
    </div>
  );
}
