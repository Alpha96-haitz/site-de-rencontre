import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import client from '../api/client';

const GENERIC_SENT = 'Si cet email existe, un code a ete envoye.';

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState('email'); // email | code | password | done
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [devCode, setDevCode] = useState('');

  const sendCode = async (e) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return;

    setLoading(true);
    try {
      const { data } = await client.post('/auth/forgot-password', { email: normalizedEmail });
      setEmail(normalizedEmail);
      setDevCode(data?.devResetCode || '');
      setStep('code');
      toast.success(GENERIC_SENT);
    } catch {
      setStep('code');
      toast.success(GENERIC_SENT);
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      toast.error('Le code doit contenir 6 chiffres.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await client.post('/auth/verify-reset-code', { email, code });
      setResetToken(data.resetToken);
      setStep('password');
      toast.success('Code valide. Vous pouvez changer le mot de passe.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Code invalide ou expire.');
    } finally {
      setLoading(false);
    }
  };

  const saveNewPassword = async (e) => {
    e.preventDefault();

    if (!resetToken) {
      toast.error('Session invalide. Recommencez.');
      setStep('email');
      return;
    }

    if (password.length < 6) {
      toast.error('Mot de passe trop court (min 6).');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      await client.post('/auth/reset-password', { token: resetToken, password });
      setStep('done');
      toast.success('Mot de passe modifie avec succes.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Impossible de modifier le mot de passe.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-rose-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-bold text-center text-pink-600 mb-2">HAITZ</h1>
        <p className="text-center text-slate-500 text-sm mb-6">Recuperation de compte</p>

        {step === 'email' && (
          <form onSubmit={sendCode} className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">Mot de passe oublie</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="exemple@email.com"
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-pink-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full py-3 bg-pink-600 text-white rounded-lg font-medium hover:bg-pink-700 disabled:opacity-50"
            >
              {loading ? 'Envoi...' : 'Envoyer le code'}
            </button>
          </form>
        )}

        {step === 'code' && (
          <form onSubmit={verifyCode} className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">Verification du code</h2>
            <p className="text-sm text-slate-500">Entrez le code recu par email pour {email}.</p>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Code (6 chiffres)</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-pink-500 tracking-[0.4em] text-center font-bold"
              />
            </div>

            {devCode && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 text-amber-800 p-3 text-sm">
                Code de dev: <span className="font-black tracking-widest">{devCode}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full py-3 bg-pink-600 text-white rounded-lg font-medium hover:bg-pink-700 disabled:opacity-50"
            >
              {loading ? 'Verification...' : 'Valider le code'}
            </button>

            <button
              type="button"
              onClick={() => setStep('email')}
              className="w-full py-2 text-slate-600 hover:text-pink-600"
            >
              Changer d email
            </button>
          </form>
        )}

        {step === 'password' && (
          <form onSubmit={saveNewPassword} className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">Nouveau mot de passe</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nouveau mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-pink-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Confirmer mot de passe</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-pink-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-pink-600 text-white rounded-lg font-medium hover:bg-pink-700 disabled:opacity-50"
            >
              {loading ? 'Enregistrement...' : 'Modifier le mot de passe'}
            </button>
          </form>
        )}

        {step === 'done' && (
          <div className="space-y-4 text-center">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              Votre mot de passe est modifie. Vous pouvez maintenant vous connecter.
            </div>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3 bg-pink-600 text-white rounded-lg font-medium hover:bg-pink-700"
            >
              Aller a la connexion
            </button>
          </div>
        )}

        <p className="mt-4 text-center">
          <Link to="/login" className="text-pink-600 font-medium hover:underline">Retour a la connexion</Link>
        </p>
      </div>
    </div>
  );
}
