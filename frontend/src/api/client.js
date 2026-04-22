/**
 * Client API Axios - Requêtes REST avec JWT
 */
import axios from 'axios';

const PROD_API_FALLBACK = 'https://site-de-rencontre-backend.onrender.com/api';

const normalizeApiUrl = (value) => {
  if (!value) return '';
  try {
    const parsed = new URL(value.trim());
    const isLocal = ['localhost', '127.0.0.1', '0.0.0.0'].includes(parsed.hostname);

    if (import.meta.env.PROD && isLocal) return PROD_API_FALLBACK;
    if (import.meta.env.PROD && parsed.protocol === 'http:') parsed.protocol = 'https:';
    return `${parsed.protocol}//${parsed.host}${parsed.pathname.replace(/\/$/, '')}`;
  } catch {
    return '';
  }
};

const explicitApiUrl = import.meta.env.VITE_API_URL;
const normalizedExplicitApiUrl =
  explicitApiUrl && explicitApiUrl.startsWith('http') ? normalizeApiUrl(explicitApiUrl) : explicitApiUrl;

const API_URL = normalizedExplicitApiUrl || (import.meta.env.PROD ? PROD_API_FALLBACK : '/api');

const client = axios.create({
  baseURL: API_URL,
  withCredentials: false,
  timeout: 10000 // 10 secondes
});

client.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('api-request-start'));
  }
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('api-request-end'));
    }
    return res;
  },
  (err) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('api-request-end'));
    }
    // Si on n'a pas de réponse du tout, c'est un problème de connexion ou de CORS
    if (!err.response) {
      err.message = 'Connexion au serveur impossible. Vérifiez votre connexion internet ou réessayez plus tard.';
      if (err.data) err.data.message = err.message;
      else err.data = { message: err.message };
    }
    return Promise.reject(err);
  }
);

export default client;
