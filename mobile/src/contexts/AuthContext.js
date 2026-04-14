import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { GOOGLE_IDS } from '../config/env';
import { authService } from '../services/authService';
import { setApiToken } from '../api/client';

WebBrowser.maybeCompleteAuthSession();

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

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: GOOGLE_IDS.webClientId,
    expoClientId: GOOGLE_IDS.expoClientId || GOOGLE_IDS.webClientId,
    androidClientId: GOOGLE_IDS.androidClientId || GOOGLE_IDS.webClientId,
    iosClientId: GOOGLE_IDS.iosClientId || GOOGLE_IDS.webClientId,
    webClientId: GOOGLE_IDS.webClientId,
    scopes: ['openid', 'profile', 'email'],
    responseType: 'id_token'
  });

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

  useEffect(() => {
    const exchangeGoogle = async () => {
      if (response?.type !== 'success') return;
      const idToken = response.params?.id_token || response.authentication?.idToken;
      if (!idToken) return;
      const data = await authService.google(idToken);
      await AsyncStorage.setItem(STORAGE_KEY, data.token);
      setApiToken(data.token);
      setToken(data.token);
      setUser(data.user);
      setIsEmailVerified(Boolean(data.user?.emailVerified));
    };
    exchangeGoogle().catch(() => {});
  }, [response]);

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

  const loginWithGoogle = async () => {
    try {
      await promptAsync();
    } catch (err) {
      console.warn("Erreur Google Auth:", err);
    }
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
      loginWithGoogle,
      checkEmailVerification,
      isEmailVerified,
      verifyEmail,
      forgotPassword,
      verifyResetCode,
      resetPassword,
      googleEnabled: Boolean(request)
    }),
    [user, token, loading, request, isEmailVerified]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
