import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import client from '../api/client';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await client.post('/auth/forgot-password', { email });
      setSent(true);
      toast.success('Si l\'email existe, un lien a été envoyé.');
    } catch {
      setSent(true);
      toast.success('Si l\'email existe, un lien a été envoyé.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-rose-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-bold text-center text-pink-600 mb-6">HAITZ</h1>
        {sent ? (
          <p className="text-slate-600 text-center">
            Vérifiez votre boîte mail pour réinitialiser votre mot de passe.
          </p>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Mot de passe oublié</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-pink-500" />
              </div>
              <button type="submit" disabled={loading} className="w-full py-3 bg-pink-600 text-white rounded-lg font-medium hover:bg-pink-700 disabled:opacity-50">
                {loading ? 'Envoi...' : 'Envoyer le lien'}
              </button>
            </form>
          </>
        )}
        <p className="mt-4 text-center">
          <Link to="/login" className="text-pink-600 font-medium hover:underline">Retour à la connexion</Link>
        </p>
      </div>
    </div>
  );
}
