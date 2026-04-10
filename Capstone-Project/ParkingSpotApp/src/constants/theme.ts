import { Appearance } from 'react-native';

/**
 * ParkSpot design tokens
 * Static tokens remain available for legacy imports.
 * Dynamic light/dark theming lives in src/theme.
 */

export const PALETTE = {
  black: '#000000',
  white: '#FFFFFF',
  blue: '#2563EB',
  blueDark: '#1D4ED8',
  gray: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
};

const LIGHT_COLORS = {
  primary: PALETTE.blue,
  primaryDark: PALETTE.blueDark,
  primaryLight: '#60A5FA',
  primaryGlow: 'rgba(37, 99, 235, 0.18)',
  primaryFaint: 'rgba(37, 99, 235, 0.10)',
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
};

export const DARK_COLORS = {
  ...LIGHT_COLORS,
  secondary: PALETTE.gray[500],
  places: PALETTE.gray[400],
  markerUnavailable: PALETTE.gray[500],
  markerPremium: PALETTE.gray[400],
  markerFree: PALETTE.gray[500],
  background: '#000000',
  backgroundMuted: '#050505',
  surface: '#121212',
  surfaceElevated: '#121212',
  surfaceMuted: '#0C0C0C',
  border: '#232323',
  borderStrong: '#323232',
  textPrimary: '#FFFFFF',
  textSecondary: '#D1D5DB',
  textMuted: '#94A3B8',
};

export const COLORS = Appearance.getColorScheme() === 'dark' ? DARK_COLORS : LIGHT_COLORS;

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 28,
    xxxl: 36,
    huge: 44,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    heavy: '800' as const,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 9999,
};

export const SHADOWS = {
  xs: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000000',
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
  glowSm: {
    shadowColor: PALETTE.blue,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 3,
  },
  glowDark: {
    shadowColor: PALETTE.blueDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 6,
  },
};

export const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#020617' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94A3B8' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#020617' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#111827' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1F2937' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#1E3A8A' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#2563EB' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#BFDBFE' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#CBD5E1' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0F172A' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#94A3B8' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#111827' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#111827' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#030712' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#E5E7EB' }] },
];

export const LIGHT_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#F8FAFC' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#374151' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#FFFFFF' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#FFFFFF' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#E5E7EB' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#DBEAFE' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#93C5FD' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#2563EB' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#DBEAFE' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#F1F5F9' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#E5E7EB' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#F8FAFC' }] },
];
