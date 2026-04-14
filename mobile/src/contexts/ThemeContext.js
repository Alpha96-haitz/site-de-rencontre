import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../theme/colors';

const ThemeContext = createContext(null);
const THEME_STORAGE_KEY = 'haitz_theme_mode';

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
};

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'dark') setIsDark(true);
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const next = !isDark;
    setIsDark(next);
    await AsyncStorage.setItem(THEME_STORAGE_KEY, next ? 'dark' : 'light');
  };

  const theme = useMemo(() => {
    const base = colors;
    if (!isDark) return base;

    return {
      ...base,
      bg: base.dark.bg,
      surface: base.dark.surface,
      text: base.dark.text,
      textMuted: base.dark.textMuted,
      border: base.dark.border,
      inputBg: base.dark.surfaceLighter,
      cardBg: base.dark.surface,
      // On garde les couleurs primary/accent
    };
  }, [isDark]);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};
