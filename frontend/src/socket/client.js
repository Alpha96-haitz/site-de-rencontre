/**
 * Client Socket.io
 */
import { io } from 'socket.io-client';

let socket = null;
let networkWatchersBound = false;

const PROD_SOCKET_FALLBACK = 'https://site-de-rencontre-backend.onrender.com';

const isLocalHost = (value) => {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return ['localhost', '127.0.0.1', '0.0.0.0'].includes(parsed.hostname);
  } catch {
    return false;
  }
};

const normalizeSocketUrl = (value) => {
  if (!value) return '';
  try {
    const parsed = new URL(value.trim());
    if (import.meta.env.PROD && isLocalHost(parsed.toString())) {
      return PROD_SOCKET_FALLBACK;
    }

    // Force Render backend if incorrectly set to Vercel string in PROD env var
    if (parsed.hostname.includes('vercel.app')) {
      return PROD_SOCKET_FALLBACK;
    }

    // Evite les mixed-content et force le protocole coherent en production.
    if (import.meta.env.PROD && parsed.protocol === 'http:') {
      parsed.protocol = 'https:';
    }
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return '';
  }
};

const getSocketBaseUrl = () => {
  const explicitSocketUrl = import.meta.env.VITE_SOCKET_URL;
  if (explicitSocketUrl && explicitSocketUrl.startsWith('http')) {
    return normalizeSocketUrl(explicitSocketUrl);
  }

  // Safety net against routing socket traffic to frontend domain on dynamic injection failure
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    return PROD_SOCKET_FALLBACK;
  }

  if (explicitSocketUrl) return explicitSocketUrl;

  return import.meta.env.PROD
    ? PROD_SOCKET_FALLBACK
    : window.location.origin;
};

const isOnline = () => (typeof navigator === 'undefined' ? true : navigator.onLine);

const bindNetworkWatchers = () => {
  if (networkWatchersBound || typeof window === 'undefined') return;
  networkWatchersBound = true;

  window.addEventListener('offline', () => {
    if (socket && socket.connected) {
      socket.disconnect();
    }
  });

  window.addEventListener('online', () => {
    if (socket && !socket.connected) {
      socket.connect();
    }
  });
};

export const getSocket = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  if (!isOnline()) return null;

  bindNetworkWatchers();

  if (!socket) {
    const socketUrl = getSocketBaseUrl();

    // Prioriser 'polling' pour assurer une connexion sur Vercel/proxies
    // et laisser socket.io tenter l'upgrade websocket ensuite.
    socket = io(socketUrl, {
      auth: { token },
      path: '/socket.io',
      transports: ['polling', 'websocket'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 8,
      reconnectionDelay: 1200,
      reconnectionDelayMax: 5000,
      timeout: 15000,
      autoConnect: true
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
