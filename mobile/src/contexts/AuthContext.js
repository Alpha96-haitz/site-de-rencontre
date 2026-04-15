import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/authService';
import { setApiToken } from '../api/client';

const STORAGE_KEY = 'haitz_token';
const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const storedToken = await AsyncStorage.getItem(STORAGE_KEY);
        if (!storedToken) return;
        setApiToken(storedToken);
        const me = await authService.me();
        setToken(storedToken);
        setUser(me);
        setIsEmailVerified(Boolean(me?.emailVerified));
      } catch {
        await AsyncStorage.removeItem(STORAGE_KEY);
        setApiToken(null);
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  const login = async (email, password) => {
    const data = await authService.login({ email, password });
    await AsyncStorage.setItem(STORAGE_KEY, data.token);
    setApiToken(data.token);
    setToken(data.token);
    setUser(data.user);
    setIsEmailVerified(Boolean(data.user?.emailVerified));
  };

  const signup = async (payload) => {
    const data = await authService.signup(payload);
    await AsyncStorage.setItem(STORAGE_KEY, data.token);
    setApiToken(data.token);
    setToken(data.token);
    setUser(data.user);
    const verified = Boolean(data.user?.emailVerified);
    setIsEmailVerified(verified);
    return { ...data, needsVerification: !verified };
  };

  const refreshUser = async () => {
    const me = await authService.me();
    setUser(me);
    setIsEmailVerified(Boolean(me?.emailVerified));
    return me;
  };

  const checkEmailVerification = async () => {
    const me = await refreshUser();
    return Boolean(me?.emailVerified);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // no-op
    }
    await AsyncStorage.removeItem(STORAGE_KEY);
    setApiToken(null);
    setToken(null);
    setUser(null);
    setIsEmailVerified(false);
  };

  const verifyEmail = async (code) => {
    const data = await authService.verifyEmail(code);
    await refreshUser();
    return data;
  };

  const forgotPassword = async (email) => {
    return await authService.forgotPassword(email);
  };

  const verifyResetCode = async (email, code) => {
    return await authService.verifyResetCode(email, code);
  };

  const resetPassword = async (token, password) => {
    return await authService.resetPassword(token, password);
  };

  const updateLocalUser = (updater) => {
    setUser(prev => {
      if (!prev) return null;
      if (typeof updater === 'function') {
        return { ...prev, ...updater(prev) };
      }
      return { ...prev, ...updater };
    });
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      signup,
      logout,
      refreshUser,
      checkEmailVerification,
      isEmailVerified,
      verifyEmail,
      forgotPassword,
      verifyResetCode,
      resetPassword,
      updateLocalUser
    }),
    [user, token, loading, isEmailVerified]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
