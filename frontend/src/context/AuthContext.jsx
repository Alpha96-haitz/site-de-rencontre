import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import client from '../api/client';
import { getSocket, disconnectSocket } from '../socket/client';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('haitz_user_skeleton');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);
  const [isEmailVerified, setIsEmailVerified] = useState(() => {
    const saved = localStorage.getItem('haitz_user_skeleton');
    if (!saved) return false;
    try {
      return !!JSON.parse(saved).emailVerified;
    } catch {
      return false;
    }
  });

  const fetchUser = useCallback(async (retryCount = 0) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setIsEmailVerified(false);
      setLoading(false);
      return;
    }
    try {
      const { data } = await client.get('/auth/me');
      setUser(data);
      const verified = Boolean(data.emailVerified);
      setIsEmailVerified(verified);
      localStorage.setItem('haitz_user_skeleton', JSON.stringify({
        _id: data._id,
        username: data.username,
        firstName: data.firstName,
        lastName: data.lastName,
        photos: data.photos,
        role: data.role,
        emailVerified: verified
      }));
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('haitz_user_skeleton');
        setUser(null);
        setIsEmailVerified(false);
        disconnectSocket();
      } else if (retryCount < 2) {
        // Retry for network errors
        setTimeout(() => fetchUser(retryCount + 1), 2000);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = useCallback(async (email, password) => {
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const { data } = await client.post('/auth/login', { email: normalizedEmail, password });
    localStorage.setItem('token', data.token);
    setUser(data.user);
    setIsEmailVerified(Boolean(data.user?.emailVerified));
    return data;
  }, []);

  const signup = useCallback(async (formData) => {
    const { data } = await client.post('/auth/signup', formData);
    localStorage.setItem('token', data.token);

    let nextUser = data.user;
    try {
      // Recharge le profil complet juste apres inscription
      // pour avoir les champs reels (photos, username, role, etc.)
      const meRes = await client.get('/auth/me');
      if (meRes?.data) nextUser = meRes.data;
    } catch {
      // Fallback: on conserve les donnees minimales de /auth/signup
    }

    setUser(nextUser);
    const verified = Boolean(nextUser?.emailVerified);
    setIsEmailVerified(verified);
    return { ...data, needsVerification: !verified };
  }, []);

  const logout = useCallback(async () => {
    try {
      await client.post('/auth/logout');
    } catch {
      // Ignorer
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('haitz_user_skeleton');
      setUser(null);
      setIsEmailVerified(false);
      disconnectSocket();
    }
  }, []);

  const refreshVerificationStatus = useCallback(async () => {
    try {
      const { data } = await client.get('/auth/me');
      setUser(data);
      const verified = Boolean(data.emailVerified);
      setIsEmailVerified(verified);
      return verified;
    } catch {
      return false;
    }
  }, []);

  const contextValue = useMemo(() => ({
    user,
    loading,
    isEmailVerified,
    login,
    signup,
    logout,
    refreshUser: fetchUser,
    refreshVerificationStatus
  }), [user, loading, isEmailVerified, login, signup, logout, fetchUser, refreshVerificationStatus]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
