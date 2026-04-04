/**
 * Client Socket.io
 */
import { io } from 'socket.io-client';

let socket = null;

const getSocketBaseUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) return import.meta.env.VITE_SOCKET_URL;

  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    try {
      const parsed = new URL(apiUrl);
      return `${parsed.protocol}//${parsed.host}`;
    } catch {
      // no-op
    }
  }

  return import.meta.env.PROD
    ? 'https://site-de-rencontre-backend.onrender.com'
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
      reconnection: true
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
