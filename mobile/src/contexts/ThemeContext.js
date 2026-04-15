import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { Appearance } from 'react-native';
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
  const [isDark, setIsDark] = useState(() => Appearance.getColorScheme() === 'dark');

  useEffect(() => {
    const loadTheme = async () => {
      const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'dark') {
        setIsDark(true);
        return;
      }

      if (stored === 'light') {
        setIsDark(false);
        return;
      }

      setIsDark(Appearance.getColorScheme() === 'dark');
    };
    loadTheme();

    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      AsyncStorage.getItem(THEME_STORAGE_KEY).then((stored) => {
        if (!stored) {
          setIsDark(colorScheme === 'dark');
        }
      });
    });

    return () => subscription.remove();
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
      surfaceLighter: base.dark.surfaceLighter,
      text: base.dark.text,
      textMuted: base.dark.textMuted,
      textGhost: base.dark.textMuted,
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
