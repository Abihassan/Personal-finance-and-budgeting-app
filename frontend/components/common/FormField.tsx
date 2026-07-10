import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, TouchableOpacity, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, interpolate } from 'react-native-reanimated';
import { COLORS } from '@/utils/constants';

interface Props extends TextInputProps {
  label: string;
  error?: string;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
}

export function FormField({ label, error, rightIcon, onRightIconPress, value, onFocus, onBlur, ...rest }: Props) {
  const [focused, setFocused] = useState(false);
  const anim = useSharedValue(value ? 1 : 0);

  const labelStyle = useAnimatedStyle(() => ({
    top: interpolate(anim.value, [0, 1], [17, 6]),
    fontSize: interpolate(anim.value, [0, 1], [16, 11]),
    color: focused ? COLORS.cyan : COLORS.textSecondary,
  }));

  const handleFocus = (e: any) => {
    setFocused(true);
    anim.value = withTiming(1, { duration: 180 });
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setFocused(false);
    if (!value) anim.value = withTiming(0, { duration: 180 });
    onBlur?.(e);
  };

  return (
    <View style={styles.wrapper}>
      <View style={[
        styles.container,
        focused && styles.containerFocused,
        !!error && styles.containerError,
      ]}>
        <Animated.Text style={[styles.label, labelStyle]}>{label}</Animated.Text>
        <TextInput
          style={styles.input}
          value={value}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor={COLORS.textMuted}
          selectionColor={COLORS.cyan}
          {...rest}
        />
        {rightIcon && (
          <TouchableOpacity style={styles.iconWrapper} onPress={onRightIconPress} hitSlop={8}>
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 14 },
  container: {
    backgroundColor: COLORS.bgInput,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingTop: 22,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 62,
  },
  containerFocused: {
    borderColor: COLORS.cyan,
  },
  containerError: {
    borderColor: COLORS.expense,
  },
  label: {
    position: 'absolute',
    left: 16,
    fontWeight: '400',
    letterSpacing: 0.2,
  },
  input: {
    flex: 1,
    color: COLORS.text,
    fontSize: 16,
    paddingTop: 2,
  },
  iconWrapper: {
    marginLeft: 8,
  },
  error: {
    color: COLORS.expense,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});
