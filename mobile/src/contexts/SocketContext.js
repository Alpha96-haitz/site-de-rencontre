import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config/env';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used inside SocketProvider');
  return ctx;
};

export const SocketProvider = ({ children }) => {
  const { token } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!token) {
      if (socket) {
        socket.disconnect();
      }
      setSocket(null);
      return;
    }

    const s = io(SOCKET_URL, {
      auth: { token },
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 8,
      reconnectionDelay: 1200
    });

    setSocket(s);
    return () => s.disconnect();
  }, [token]);

  const value = useMemo(() => ({ socket }), [socket]);
  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};
