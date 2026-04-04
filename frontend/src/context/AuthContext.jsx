/**
 * Contexte d'authentification global
 */
import { createContext, useContext, useState, useEffect } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { data } = await client.get('/auth/me');
      setUser(data);
    } catch (err) {
      const status = err?.response?.status;

      // Ne deconnecter automatiquement que si le token est vraiment invalide
      if (status === 401 || status === 403) {
        localStorage.removeItem('token');
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = async (email, password) => {
    const { data } = await client.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data;
  };

  const signup = async (formData) => {
    const { data } = await client.post('/auth/signup', formData);
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data;
  };

  const loginWithGoogle = async (credential) => {
    const { data } = await client.post('/auth/google', { credential });
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    try {
      await client.post('/auth/logout');
    } catch {
      // Ignorer les erreurs (ex: token expiré)
    } finally {
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, loginWithGoogle, logout, refreshUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};
