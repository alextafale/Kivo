// frontend/application/context/ThemeContext.tsx
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Tokens de color ──────────────────────────────────────────────────────────

export interface ThemeColors {
  bg: string;
  surface: string;
  card: string;
  border: string;
  green: string;
  greenDark: string;
  greenGlow: string;
  greenSoft: string;
  textPrimary: string;
  textSec: string;
  textMuted: string;
  userBubble: string;
  botBubble: string;
  inputBg: string;
  placeholderText: string;
  // Perfil / settings
  pageBg: string;
  cardBg: string;
  rowDivider: string;
  labelText: string;
  titleText: string;
  subtitleText: string;
  backBtnBg: string;
  iconBg: string;
  signOutBg: string;
  signOutBorder: string;
  modalBg: string;
  modalInputBg: string;
  modalInputBorder: string;
  cancelBtnBg: string;
  searchBg: string;
}

export const darkColors: ThemeColors = {
  bg: '#000000',
  surface: '#000000',
  card: '#0A0A0A',
  border: '#1A1A1A',
  green: '#00FF87',
  greenDark: '#00CC6A',
  greenGlow: '#00FF8710',
  greenSoft: '#00E676',
  textPrimary: '#FFFFFF',
  textSec: '#888888',
  textMuted: '#333333',
  userBubble: '#00FF87',
  botBubble: '#0A0A0A',
  inputBg: '#0D0D0D',
  placeholderText: '#374151',
  // Perfil / settings
  pageBg: '#0A0A0A',
  cardBg: '#111111',
  rowDivider: '#1A1A1A',
  labelText: '#555555',
  titleText: '#FFFFFF',
  subtitleText: '#888888',
  backBtnBg: '#111111',
  iconBg: '#111111',
  signOutBg: '#1A0A0A',
  signOutBorder: '#330000',
  modalBg: '#111111',
  modalInputBg: '#0A0A0A',
  modalInputBorder: '#1A1A1A',
  cancelBtnBg: '#1A1A1A',
  searchBg: '#1A1A1A',
};

export const lightColors: ThemeColors = {
  bg: '#FFFFFF',
  surface: '#FFFFFF',
  card: '#F8FAFC',
  border: '#E2E8F0',
  green: '#16a34a',
  greenDark: '#15803d',
  greenGlow: '#DCFCE7',
  greenSoft: '#22c55e',
  textPrimary: '#0F172A',
  textSec: '#64748B',
  textMuted: '#CBD5E1',
  userBubble: '#16a34a',
  botBubble: '#F1F5F9',
  inputBg: '#F8FAFC',
  placeholderText: '#94A3B8',
  // Perfil / settings
  pageBg: '#F0FDF4',
  cardBg: '#FFFFFF',
  rowDivider: '#F1F5F9',
  labelText: '#94A3B8',
  titleText: '#0F172A',
  subtitleText: '#64748B',
  backBtnBg: '#FFFFFF',
  iconBg: '#F0FDF4',
  signOutBg: '#FFF5F5',
  signOutBorder: '#FEE2E2',
  modalBg: '#FFFFFF',
  modalInputBg: '#F8FAFC',
  modalInputBorder: '#E2E8F0',
  cancelBtnBg: '#F1F5F9',
  searchBg: '#F3F4F6',
};

// ─── Context ──────────────────────────────────────────────────────────────────

interface ThemeContextValue {
  isDark: boolean;
  toggleTheme: () => void;
  colors: ThemeColors;
}

const STORAGE_KEY = '@kivo_theme';

const ThemeContext = createContext<ThemeContextValue>({
  isDark: true,
  toggleTheme: () => {},
  colors: darkColors,
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme(); // 'dark' | 'light' | null
  const [isDark, setIsDark] = useState<boolean>(systemScheme !== 'light');

  // Cargar preferencia guardada al montar
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved !== null) {
        setIsDark(saved === 'dark');
      }
    });
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      AsyncStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
      return next;
    });
  };

  const colors = useMemo(() => (isDark ? darkColors : lightColors), [isDark]);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTheme() {
  return useContext(ThemeContext);
}
