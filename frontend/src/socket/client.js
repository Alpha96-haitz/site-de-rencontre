/**
 * Client Socket.io
 */
import { io } from 'socket.io-client';

let socket = null;
let networkWatchersBound = false;
let visibilityWatcherBound = false;

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
    const token = localStorage.getItem('token');
    if (token) connectSocket({ token, priority: 'high' });
  });
};

const ensureSocket = (token) => {
  if (!token) return null;
  if (!isOnline()) return null;

  bindNetworkWatchers();

  if (!socket) {
    const socketUrl = getSocketBaseUrl();

    // Important perf: don't auto-connect on app boot. Pages that need realtime should call connectSocket().
    // In production, try websocket first (less HTTP chatter than polling), fall back to polling if needed.
    socket = io(socketUrl, {
      auth: { token },
      path: '/socket.io',
      transports: import.meta.env.PROD ? ['websocket', 'polling'] : ['polling', 'websocket'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 900,
      reconnectionDelayMax: 6000,
      timeout: 12000,
      autoConnect: false,
      rememberUpgrade: true
    });

    // Stop reconnect storms when the tab is in background.
    if (!visibilityWatcherBound && typeof document !== 'undefined') {
      visibilityWatcherBound = true;
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden' && socket?.connected) {
          socket.disconnect();
        }
        if (document.visibilityState === 'visible') {
          const t = localStorage.getItem('token');
          if (t) connectSocket({ token: t, priority: 'low' });
        }
      });
    }
  } else {
    // Token can change after login/logout; keep it fresh.
    socket.auth = { token };
  }

  return socket;
};

export const getSocket = () => socket;

export const connectSocket = ({ token, priority = 'low' } = {}) => {
  const resolvedToken = token || localStorage.getItem('token');
  const s = ensureSocket(resolvedToken);
  if (!s) return null;

  const doConnect = () => {
    if (!s.connected) s.connect();
  };

  if (priority === 'high') {
    doConnect();
    return s;
  }

  // Defer low-priority connects to avoid slowing initial page load.
  if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(() => doConnect(), { timeout: 2000 });
  } else {
    setTimeout(() => doConnect(), 600);
  }

  return s;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
