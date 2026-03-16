import { TextStyle } from 'react-native';

// FurInventory Pro - Luxury Dark Theme
export const theme = {
  // Primary: Elegant Gold for luxury touch
  primary: '#D4AF37',
  primaryLight: '#E6C868',
  primaryDark: '#B8941F',

  // Dark Mode Base
  background: '#0A0A0A',
  backgroundSecondary: '#1A1A1A',
  surface: '#1F1F1F',
  surfaceElevated: '#2A2A2A',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',

  // Borders & Dividers
  border: '#374151',
  borderLight: '#2A2A2A',

  // Status Colors
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  notification: '#EF4444',

  // Inventory Status
  available: '#10B981',
  sold: '#6B7280',
  alert: '#F59E0B',

  // Location Colors
  warehouse: '#3B82F6',
  showcase: '#D4AF37',
  workshop: '#8B5CF6',
  stand: '#10B981',
};

export const typography: { [key: string]: TextStyle } = {
  // Hero Data (for dashboard stats)
  heroData: { fontSize: 48, fontWeight: '700', color: theme.primary },
  heroLabel: { fontSize: 11, fontWeight: '600', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },

  // Card Content
  cardTitle: { fontSize: 16, fontWeight: '600', color: theme.textPrimary },
  cardValue: { fontSize: 24, fontWeight: '700', color: theme.textPrimary },
  cardLabel: { fontSize: 13, fontWeight: '400', color: theme.textSecondary },

  // Body Text
  body: { fontSize: 15, fontWeight: '400', color: theme.textPrimary },
  bodySecondary: { fontSize: 15, fontWeight: '400', color: theme.textSecondary },
  caption: { fontSize: 13, fontWeight: '400', color: theme.textSecondary },

  // Section Headers
  sectionHeader: { fontSize: 14, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, color: theme.textSecondary },

  // Buttons
  buttonPrimary: { fontSize: 16, fontWeight: '600', color: '#000000' },
  buttonSecondary: { fontSize: 16, fontWeight: '600', color: theme.primary },
};

export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  cardElevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
};

export const borderRadius = {
  small: 8,
  medium: 12,
  large: 16,
  full: 9999,
};

export const spacing = {
  screenPadding: 16,
  cardGap: 12,
  sectionGap: 24,
};
