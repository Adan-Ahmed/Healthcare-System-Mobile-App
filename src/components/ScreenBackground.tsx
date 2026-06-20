import React from 'react';
import {StyleSheet, View, ViewStyle} from 'react-native';
import {AppColors} from '../theme/colors';

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
};

/**
 * Soft blue vertical blend + decorative blobs — pure Views (no native gradient module).
 * Avoids BVLinearGradient / linking issues on Android.
 */
const ScreenBackground: React.FC<Props> = ({children, style}) => {
  return (
    <View style={[styles.flex, style]}>
      <View style={[StyleSheet.absoluteFill, styles.gradientStripes]} pointerEvents="none">
        <View style={[styles.stripe, {backgroundColor: AppColors.bgTop}]} />
        <View style={[styles.stripe, {backgroundColor: AppColors.bgMid}]} />
        <View style={[styles.stripe, {backgroundColor: AppColors.bgBottom}]} />
      </View>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View
          style={[
            styles.blob,
            {
              top: -70,
              right: -50,
              width: 240,
              height: 240,
              backgroundColor: AppColors.blob1,
            },
          ]}
        />
        <View
          style={[
            styles.blob,
            {
              bottom: '12%',
              left: -90,
              width: 280,
              height: 280,
              backgroundColor: AppColors.blob2,
            },
          ]}
        />
        <View
          style={[
            styles.blob,
            {
              top: '38%',
              right: -40,
              width: 120,
              height: 120,
              backgroundColor: AppColors.blob3,
            },
          ]}
        />
      </View>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  flex: {flex: 1, overflow: 'hidden'},
  gradientStripes: {flexDirection: 'column'},
  stripe: {flex: 1},
  blob: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.9,
  },
});

export default ScreenBackground;
