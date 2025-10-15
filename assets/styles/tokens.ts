// assets/styles/tokens.ts
import { useColorScheme } from 'react-native';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
};

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

// Neutral gray scale
export const neutralColors = {
  white: '#FFFFFF',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  black: '#000000',
};

// Semantic colors for light mode
export const lightColors = {
  // Backgrounds
  background: neutralColors.white,
  backgroundSecondary: neutralColors.gray50,
  backgroundTertiary: neutralColors.gray100,
  
  // Surfaces (cards, modals, etc)
  surface: neutralColors.white,
  surfaceSecondary: neutralColors.gray50,
  
  // Text
  text: neutralColors.gray900,
  textSecondary: neutralColors.gray600,
  textTertiary: neutralColors.gray500,
  textDisabled: neutralColors.gray400,
  textInverse: neutralColors.white,
  
  // Borders
  border: neutralColors.gray200,
  borderSecondary: neutralColors.gray300,
  
  // Primary brand color
  primary: '#007AFF',
  primaryHover: '#0051D5',
  primaryDisabled: '#B3D7FF',
  
  // Secondary
  secondary: '#5856D6',
  secondaryHover: '#3634A3',
  
  // Pastel Green (for buttons)
  pastelGreen: '#C8E6C9',
  pastelGreenText: '#2E7D32',
  pastelGreenHover: '#A5D6A7',
  
  // Status colors
  success: '#34C759',
  successBackground: '#D1F4DD',
  warning: '#FF9500',
  warningBackground: '#FFE5CC',
  error: '#FF3B30',
  errorBackground: '#FFE5E5',
  info: '#5AC8FA',
  infoBackground: '#E5F6FF',
  
  // Chart colors (for data visualization)
  chartBlue: '#007AFF',
  chartGreen: '#34C759',
  chartOrange: '#FF9500',
  chartRed: '#FF3B30',
  chartPurple: '#5856D6',
  chartPink: '#FF2D55',
  chartTeal: '#5AC8FA',
  chartIndigo: '#5856D6',
};

// Semantic colors for dark mode
export const darkColors = {
  // Backgrounds
  background: neutralColors.black,
  backgroundSecondary: neutralColors.gray900,
  backgroundTertiary: neutralColors.gray800,
  
  // Surfaces
  surface: neutralColors.gray900,
  surfaceSecondary: neutralColors.gray800,
  
  // Text
  text: neutralColors.white,
  textSecondary: neutralColors.gray300,
  textTertiary: neutralColors.gray400,
  textDisabled: neutralColors.gray600,
  textInverse: neutralColors.gray900,
  
  // Borders
  border: neutralColors.gray700,
  borderSecondary: neutralColors.gray600,
  
  // Primary brand color (adjusted for dark mode)
  primary: '#0A84FF',
  primaryHover: '#409CFF',
  primaryDisabled: '#1C3A5A',
  
  // Secondary
  secondary: '#5E5CE6',
  secondaryHover: '#7D7AFF',
  
  // Pastel Green (for buttons in dark mode)
  pastelGreen: '#A5D6A7',
  pastelGreenText: '#1B5E20',
  pastelGreenHover: '#81C784',
  
  // Status colors (adjusted for dark mode)
  success: '#32D74B',
  successBackground: '#1A3A26',
  warning: '#FF9F0A',
  warningBackground: '#3D2E1A',
  error: '#FF453A',
  errorBackground: '#3D1F1E',
  info: '#64D2FF',
  infoBackground: '#1A3140',
  
  // Chart colors (adjusted for dark mode visibility)
  chartBlue: '#0A84FF',
  chartGreen: '#32D74B',
  chartOrange: '#FF9F0A',
  chartRed: '#FF453A',
  chartPurple: '#BF5AF2',
  chartPink: '#FF375F',
  chartTeal: '#64D2FF',
  chartIndigo: '#5E5CE6',
};

// Hook to get theme-aware colors
export const useThemeColors = () => {
  const colorScheme = useColorScheme();
  return colorScheme === 'dark' ? darkColors : lightColors;
};

// Legacy export for backwards compatibility
export const colors = lightColors;
