import React, { useEffect } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { COLORS } from '@/utils/constants';

interface Props {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 20, borderRadius = 8, style }: Props) {
  const anim = useSharedValue(0);

  useEffect(() => {
    anim.value = withRepeat(withTiming(1, { duration: 900 }), -1, true);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      anim.value,
      [0, 1],
      [COLORS.bgCard, COLORS.bgCardAlt]
    ),
  }));

  return (
    <Animated.View
      style={[{ width: width as any, height, borderRadius }, animStyle, style]}
    />
  );
}

// Preset skeleton layouts
export function CardSkeleton() {
  return (
    <Animated.View style={styles.card}>
      <Skeleton height={18} width={120} borderRadius={6} style={styles.mb} />
      <Skeleton height={32} width={180} borderRadius={6} style={styles.mb} />
      <Skeleton height={14} width="60%" borderRadius={6} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  mb: { marginBottom: 10 },
});
