import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ActivityIndicator, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { COLORS, GRADIENTS } from '@/utils/constants';

interface Props {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'brand' | 'outline' | 'ghost';
  style?: ViewStyle;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function GradientButton({ label, onPress, loading, disabled, variant = 'brand', style }: Props) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  if (variant === 'outline') {
    return (
      <AnimatedTouchable
        style={[styles.outline, animStyle, style]}
        onPress={handlePress}
        onPressIn={() => { scale.value = withSpring(0.96); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        activeOpacity={1}
        disabled={disabled || loading}
      >
        <Text style={styles.outlineLabel}>{label}</Text>
      </AnimatedTouchable>
    );
  }

  if (variant === 'ghost') {
    return (
      <AnimatedTouchable
        style={[animStyle, style]}
        onPress={handlePress}
        onPressIn={() => { scale.value = withSpring(0.96); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        activeOpacity={0.7}
        disabled={disabled || loading}
      >
        <Text style={styles.ghostLabel}>{label}</Text>
      </AnimatedTouchable>
    );
  }

  return (
    <AnimatedTouchable
      style={[styles.wrapper, animStyle, (disabled || loading) && styles.disabled, style]}
      onPress={handlePress}
      onPressIn={() => { scale.value = withSpring(0.96); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      activeOpacity={1}
      disabled={disabled || loading}
    >
      <LinearGradient
        colors={GRADIENTS.brand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        {loading
          ? <ActivityIndicator color="#fff" size="small" />
          : <Text style={styles.label}>{label}</Text>
        }
      </LinearGradient>
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  gradient: {
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  disabled: {
    opacity: 0.5,
  },
  outline: {
    height: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineLabel: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '500',
  },
  ghostLabel: {
    color: COLORS.cyan,
    fontSize: 15,
    fontWeight: '500',
  },
});
