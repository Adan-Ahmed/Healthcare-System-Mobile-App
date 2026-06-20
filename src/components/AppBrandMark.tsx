import React from 'react';
import {View, StyleSheet} from 'react-native';
import {Text} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {AppColors} from '../theme/colors';

/**
 * In-app logo + download accent (decorative brand mark).
 */
const AppBrandMark: React.FC<{subtitle?: string}> = ({subtitle = 'Care, connected'}) => {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconRing}>
        <MaterialCommunityIcons name="heart-pulse" size={40} color="#FFFFFF" />
        <View style={styles.downloadBadge}>
          <MaterialCommunityIcons name="download-circle" size={22} color={AppColors.primary} />
        </View>
      </View>
      <Text variant="headlineSmall" style={styles.title}>
        Healthcare System
      </Text>
      <Text variant="bodyMedium" style={styles.sub}>
        {subtitle}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {alignItems: 'center', marginBottom: 8},
  iconRing: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: AppColors.primary,
    borderWidth: 2,
    borderColor: AppColors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: AppColors.primary,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  downloadBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  title: {
    fontWeight: '800',
    color: AppColors.text,
    letterSpacing: -0.5,
  },
  sub: {
    color: AppColors.textSecondary,
    marginTop: 4,
  },
});

export default AppBrandMark;
