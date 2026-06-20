import {MD3LightTheme} from 'react-native-paper';
import {AppColors} from './colors';

export const theme = {
  ...MD3LightTheme,
  roundness: 14,
  colors: {
    ...MD3LightTheme.colors,
    primary: AppColors.primary,
    primaryContainer: AppColors.primaryTint,
    secondary: AppColors.primarySoft,
    secondaryContainer: AppColors.bgMid,
    tertiary: AppColors.primaryMuted,
    surface: AppColors.surface,
    surfaceVariant: '#F1F5F9',
    background: AppColors.bgMid,
    error: AppColors.error,
    onPrimary: '#FFFFFF',
    onSurface: AppColors.text,
    onSurfaceVariant: AppColors.textSecondary,
    outline: AppColors.border,
    elevation: {
      ...MD3LightTheme.colors.elevation,
      level1: '#FFFFFF',
      level2: '#FFFFFF',
      level3: '#FFFFFF',
      level4: '#FFFFFF',
      level5: '#FFFFFF',
    },
  },
};
