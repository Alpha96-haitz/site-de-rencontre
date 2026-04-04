import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import client from '../api/client';

const MIN_PASSWORD = 6;

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

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

    if (!token || !tokenValid) {
      toast.error('Lien invalide ou expire.');
      return;
    }

    if (password.length < MIN_PASSWORD) {
      toast.error(`Le mot de passe doit contenir au moins ${MIN_PASSWORD} caracteres.`);
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      await client.post('/auth/reset-password', { token, password });
      setDone(true);
      toast.success('Mot de passe reinitialise avec succes.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Impossible de reinitialiser le mot de passe.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-rose-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-bold text-center text-pink-600 mb-2">HAITZ</h1>
        <p className="text-center text-slate-500 text-sm mb-6">Reinitialisation du mot de passe</p>

        {checkingToken ? (
          <div className="text-center text-slate-500">Verification du lien...</div>
        ) : done ? (
          <div className="space-y-4 text-center">
            <p className="text-slate-700">Votre mot de passe a ete mis a jour.</p>
            <Link to="/login" className="inline-block px-5 py-2.5 rounded-lg bg-pink-600 text-white font-semibold hover:bg-pink-700">
              Aller a la connexion
            </Link>
          </div>
        ) : !tokenValid ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700 text-sm">
              Ce lien de reinitialisation est invalide ou expire.
            </div>
            <Link to="/forgot-password" className="block text-center w-full py-3 bg-pink-600 text-white rounded-lg font-medium hover:bg-pink-700">
              Demander un nouveau lien
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Nouveau mot de passe</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe (min. {MIN_PASSWORD})</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={MIN_PASSWORD}
                  autoComplete="new-password"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-pink-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Confirmer le mot de passe</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={MIN_PASSWORD}
                  autoComplete="new-password"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-pink-500"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-pink-600 text-white rounded-lg font-medium hover:bg-pink-700 disabled:opacity-50"
              >
                {loading ? 'Enregistrement...' : 'Reinitialiser le mot de passe'}
              </button>
            </form>
          </>
        )}

        <p className="mt-4 text-center">
          <Link to="/login" className="text-pink-600 font-medium hover:underline">Connexion</Link>
        </p>
      </div>
    </div>
  );
}
