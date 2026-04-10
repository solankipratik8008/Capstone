import React, { createContext, useContext, useMemo } from 'react';
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
  Theme as NavigationTheme,
} from '@react-navigation/native';
import { useColorScheme } from 'react-native';

import { BORDER_RADIUS, DARK_COLORS, FONTS, PALETTE, SPACING } from '../constants/theme';

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  mode: ThemeMode;
  primary: string;
  primaryDark: string;
  primaryLight: string;
  primaryFaint: string;
  primaryGlow: string;
  secondary: string;
  accent: string;
  places: string;
  markerAvailable: string;
  markerUnavailable: string;
  markerPremium: string;
  markerFree: string;
  markerSelected: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  white: string;
  black: string;
  gray: typeof PALETTE.gray;
  background: string;
  backgroundMuted: string;
  surface: string;
  surfaceElevated: string;
  surfaceMuted: string;
  border: string;
  borderStrong: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textOnPrimary: string;
  textAccent: string;
  shadow: string;
  overlay: string;
  inputBackground: string;
  inputPlaceholder: string;
  tabBar: string;
  tabBarBorder: string;
  skeleton: string;
  badgeNeutral: string;
}

export interface AppTheme {
  isDark: boolean;
  colors: ThemeColors;
  spacing: typeof SPACING;
  radii: typeof BORDER_RADIUS;
  typography: typeof FONTS;
  shadows: typeof lightShadows;
  navigationTheme: NavigationTheme;
}

const alpha = (hex: string, opacity: number) => {
  const normalized = hex.replace('#', '');
  const expanded = normalized.length === 3
    ? normalized.split('').map((char) => char + char).join('')
    : normalized;
  const alphaValue = Math.round(Math.max(0, Math.min(1, opacity)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `#${expanded}${alphaValue}`;
};

const lightColors: ThemeColors = {
  mode: 'light',
  primary: PALETTE.blue,
  primaryDark: PALETTE.blueDark,
  primaryLight: '#60A5FA',
  primaryFaint: alpha(PALETTE.blue, 0.1),
  primaryGlow: alpha(PALETTE.blue, 0.18),
  secondary: PALETTE.gray[700],
  accent: PALETTE.blue,
  places: PALETTE.gray[600],
  markerAvailable: PALETTE.blue,
  markerUnavailable: PALETTE.gray[700],
  markerPremium: PALETTE.gray[600],
  markerFree: PALETTE.gray[500],
  markerSelected: PALETTE.black,
  success: PALETTE.blue,
  warning: PALETTE.gray[700],
  error: PALETTE.gray[900],
  info: PALETTE.blue,
  white: PALETTE.white,
  black: PALETTE.black,
  gray: PALETTE.gray,
  background: '#FFFFFF',
  backgroundMuted: '#F8FAFC',
  surface: '#F5F5F5',
  surfaceElevated: '#F5F5F5',
  surfaceMuted: '#FFFFFF',
  border: '#E5E7EB',
  borderStrong: '#D1D5DB',
  textPrimary: '#111111',
  textSecondary: PALETTE.gray[700],
  textMuted: PALETTE.gray[500],
  textOnPrimary: PALETTE.white,
  textAccent: PALETTE.blue,
  shadow: alpha(PALETTE.black, 0.08),
  overlay: alpha(PALETTE.black, 0.18),
  inputBackground: '#F5F5F5',
  inputPlaceholder: PALETTE.gray[400],
  tabBar: '#FFFFFF',
  tabBarBorder: PALETTE.gray[200],
  skeleton: PALETTE.gray[200],
  badgeNeutral: PALETTE.gray[100],
};

const darkColors: ThemeColors = {
  mode: 'dark',
  primary: PALETTE.blue,
  primaryDark: PALETTE.blueDark,
  primaryLight: '#60A5FA',
  primaryFaint: alpha(PALETTE.blue, 0.14),
  primaryGlow: alpha(PALETTE.blue, 0.22),
  secondary: PALETTE.gray[500],
  accent: PALETTE.blue,
  places: PALETTE.gray[400],
  markerAvailable: PALETTE.blue,
  markerUnavailable: PALETTE.gray[500],
  markerPremium: PALETTE.gray[400],
  markerFree: PALETTE.gray[500],
  markerSelected: PALETTE.white,
  success: PALETTE.blue,
  warning: PALETTE.gray[400],
  error: PALETTE.gray[300],
  info: PALETTE.blue,
  white: PALETTE.white,
  black: PALETTE.black,
  gray: PALETTE.gray,
  background: '#000000',
  backgroundMuted: '#050505',
  surface: '#121212',
  surfaceElevated: '#121212',
  surfaceMuted: '#0C0C0C',
  border: '#232323',
  borderStrong: '#323232',
  textPrimary: '#FFFFFF',
  textSecondary: '#E5E7EB',
  textMuted: '#94A3B8',
  textOnPrimary: PALETTE.white,
  textAccent: '#93C5FD',
  shadow: alpha(PALETTE.black, 0.35),
  overlay: alpha(PALETTE.black, 0.45),
  inputBackground: '#121212',
  inputPlaceholder: '#64748B',
  tabBar: '#050505',
  tabBarBorder: '#121212',
  skeleton: '#232323',
  badgeNeutral: '#1F2937',
};

const lightShadows = {
  xs: {
    shadowColor: PALETTE.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: PALETTE.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  md: {
    shadowColor: PALETTE.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  lg: {
    shadowColor: PALETTE.black,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.1,
    shadowRadius: 28,
    elevation: 8,
  },
  glow: {
    shadowColor: PALETTE.blue,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 6,
  },
};

const darkShadows = {
  xs: {
    shadowColor: PALETTE.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 3,
    elevation: 1,
  },
  sm: {
    shadowColor: PALETTE.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 3,
  },
  md: {
    shadowColor: PALETTE.black,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.24,
    shadowRadius: 22,
    elevation: 5,
  },
  lg: {
    shadowColor: PALETTE.black,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.28,
    shadowRadius: 30,
    elevation: 8,
  },
  glow: {
    shadowColor: PALETTE.blue,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 22,
    elevation: 6,
  },
};

const buildNavigationTheme = (isDark: boolean, colors: ThemeColors): NavigationTheme => {
  const baseTheme = isDark ? NavigationDarkTheme : NavigationDefaultTheme;
  return {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.textPrimary,
      border: colors.border,
      notification: colors.primary,
    },
  };
};

const defaultTheme: AppTheme = {
  isDark: false,
  colors: lightColors,
  spacing: SPACING,
  radii: BORDER_RADIUS,
  typography: FONTS,
  shadows: lightShadows,
  navigationTheme: buildNavigationTheme(false, lightColors),
};

const ThemeContext = createContext<AppTheme>(defaultTheme);

export const ThemeProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const theme = useMemo<AppTheme>(() => {
    const colors = isDark ? darkColors : lightColors;
    return {
      isDark,
      colors,
      spacing: SPACING,
      radii: BORDER_RADIUS,
      typography: FONTS,
      shadows: isDark ? darkShadows : lightShadows,
      navigationTheme: buildNavigationTheme(isDark, colors),
    };
  }, [isDark]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
};

export const useAppTheme = (): AppTheme => useContext(ThemeContext);
export const useThemeColors = () => useAppTheme().colors;

export const LEGACY_THEME_COLORS = {
  light: lightColors,
  dark: { ...DARK_COLORS, ...darkColors },
};
