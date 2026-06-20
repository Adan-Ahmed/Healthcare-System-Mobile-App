import {StyleSheet, Platform} from 'react-native';
import {AppColors} from './colors';

export const sharedScreen = StyleSheet.create({
  flex: {flex: 1},
  scrollCenter: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 22,
    paddingTop: Platform.OS === 'ios' ? 16 : 24,
  },
  scrollPad: {
    padding: 20,
    paddingBottom: 32,
  },
  heroCard: {
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.96)',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    ...Platform.select({
      ios: {
        shadowColor: '#2563EB',
        shadowOffset: {width: 0, height: 14},
        shadowOpacity: 0.12,
        shadowRadius: 28,
      },
      android: {elevation: 10},
    }),
  },
  surfaceCard: {
    borderRadius: 18,
    backgroundColor: AppColors.surface,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: AppColors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: {elevation: 3},
    }),
  },
  headerBar: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 52,
    paddingBottom: 18,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  headerTitle: {
    fontWeight: '800',
    color: AppColors.text,
    letterSpacing: -0.3,
  },
  headerSub: {
    color: AppColors.textSecondary,
    marginTop: 4,
  },
});
