/**
 * Client Socket.io
 */
import { io } from 'socket.io-client';

let socket = null;

export const getSocket = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  if (!socket) {
    socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || window.location.origin, {
      auth: { token },
      path: '/socket.io'
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
