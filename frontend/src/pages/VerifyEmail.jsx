import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import client from '../api/client';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Verification en cours...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Lien de verification incomplet.');
      return;
    }

    const params = new URLSearchParams({ token });
    if (email) params.set('email', email);

    client.get(`/auth/verify-email?${params.toString()}`)
      .then((response) => {
        setStatus('ok');
        setMessage(response?.data?.message || 'Votre email a ete verifie avec succes.');
        toast.success('Email verifie !');
      })
      .catch((error) => {
        const backendMessage = error?.response?.data?.message;
        if (backendMessage === 'Email deja verifie') {
          setStatus('ok');
          setMessage('Votre email est deja verifie. Vous pouvez vous connecter.');
          toast.success('Email deja verifie');
          return;
        }

        setStatus('error');
        setMessage(backendMessage || 'Lien invalide ou expire.');
      });
  }, [token, email]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-rose-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
        <h1 className="text-2xl font-bold text-pink-600 mb-4">MeetUp</h1>
        <p className={status === 'error' ? 'text-red-600' : 'text-slate-600'}>{message}</p>
        <Link to="/login" className="mt-4 inline-block text-pink-600 font-medium hover:underline">Se connecter</Link>
      </div>
    </div>
  );
}
