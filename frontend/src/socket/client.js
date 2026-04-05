/**
 * Client Socket.io
 */
import { io } from 'socket.io-client';

let socket = null;

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
  const explicitSocketUrl = normalizeSocketUrl(import.meta.env.VITE_SOCKET_URL);
  if (explicitSocketUrl) return explicitSocketUrl;

  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    const normalized = normalizeSocketUrl(apiUrl);
    if (normalized) return normalized;
  }

  return import.meta.env.PROD
    ? PROD_SOCKET_FALLBACK
    : window.location.origin;
};

export const getSocket = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  if (!socket) {
    const socketUrl = getSocketBaseUrl();

    socket = io(socketUrl, {
      auth: { token },
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 8,
      reconnectionDelay: 1200,
      reconnectionDelayMax: 5000,
      timeout: 12000,
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
