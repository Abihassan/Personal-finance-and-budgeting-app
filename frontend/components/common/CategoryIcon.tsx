import React from 'react';
import { Image, ImageSourcePropType, StyleSheet } from 'react-native';

interface Props {
  icon: ImageSourcePropType;
  size?: number;
  /** Unused for PNG icons (the source images are already full-color), kept
   *  so existing call sites that still pass a `color` prop don't break. */
  color?: string;
}

/**
 * Renders a real PNG icon (from utils/constants.ts → ICONS) at the given size.
 * This replaces every site that used to render a raw emoji string via <Text>,
 * and replaces the earlier vector-icon (Ionicons/MaterialCommunityIcons)
 * placeholder version of this component.
 *
 * Usage:
 *   <CategoryIcon icon={cat.icon} size={20} />
 */
export function CategoryIcon({ icon, size = 20 }: Props) {
  return (
    <Image
      source={icon}
      style={[styles.icon, { width: size, height: size }]}
      resizeMode="contain"
    />
  );
}

const styles = StyleSheet.create({
  icon: {
    // PNGs are flat multi-color illustrations — no tint applied
  },
});
