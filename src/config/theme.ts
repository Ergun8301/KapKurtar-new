// KapKurtar Theme Configuration

export const COLORS = {
  // Brand colors
  primary: '#00A690',
  secondary: '#F75C00',
  background: '#F7F2E7',

  // Neutral colors
  white: '#FFFFFF',
  black: '#000000',
  text: '#1A1A1A',
  textLight: '#666666',
  textMuted: '#999999',

  // UI colors
  border: '#E0E0E0',
  error: '#E53935',
  success: '#4CAF50',
  warning: '#FFC107',
  info: '#2196F3',

  // Category colors
  bakery: '#E8A830',
  restaurant: '#E53935',
  grocery: '#4CAF50',
  cafe: '#795548',
  supermarket: '#2196F3',
  other: '#9E9E9E',
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const FONT_SIZES = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 24,
  xxxl: 32,
} as const;

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  full: 9999,
} as const;

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
} as const;

// Istanbul coordinates
export const ISTANBUL_CENTER = {
  latitude: 41.0082,
  longitude: 28.9784,
} as const;

export default {
  COLORS,
  SPACING,
  FONT_SIZES,
  BORDER_RADIUS,
  SHADOWS,
  ISTANBUL_CENTER,
};
