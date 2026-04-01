import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import client from '../api/client';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    if (!token) return setStatus('error');
    client.get(`/auth/verify-email?token=${token}`)
      .then(() => { setStatus('ok'); toast.success('Email vérifié !'); })
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-rose-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
        <h1 className="text-2xl font-bold text-pink-600 mb-4">MeetUp</h1>
        {status === 'loading' && <p>Vérification en cours...</p>}
        {status === 'ok' && <p className="text-slate-600">Votre email a été vérifié avec succès.</p>}
        {status === 'error' && <p className="text-red-600">Lien invalide ou expiré.</p>}
        <Link to="/login" className="mt-4 inline-block text-pink-600 font-medium hover:underline">Se connecter</Link>
      </div>
    </div>
  );
}
