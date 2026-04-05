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

const API_URL = normalizeApiUrl(import.meta.env.VITE_API_URL) ||
  (import.meta.env.PROD ? PROD_API_FALLBACK : 'http://localhost:5000/api');

const client = axios.create({
  baseURL: API_URL,
  withCredentials: false
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    // Ne pas deconnecter globalement sur un 401 ponctuel (ex: endpoint secondaire)
    // La validation de session se fait deja via /auth/me dans AuthContext.
    return Promise.reject(err);
  }
);

export default client;
