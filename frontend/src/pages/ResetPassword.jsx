import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import client from '../api/client';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return toast.error('Lien invalide');
    setLoading(true);
    try {
      await client.post('/auth/reset-password', { token, password });
      setDone(true);
      toast.success('Mot de passe réinitialisé');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-rose-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-bold text-center text-pink-600 mb-6">MeetUp</h1>
        {done ? (
          <p className="text-slate-600 text-center">Vous pouvez maintenant vous connecter.</p>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Nouveau mot de passe</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe (min. 6)</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-pink-500" />
              </div>
              <button type="submit" disabled={loading || !token} className="w-full py-3 bg-pink-600 text-white rounded-lg font-medium hover:bg-pink-700 disabled:opacity-50">
                {loading ? 'Enregistrement...' : 'Réinitialiser'}
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
