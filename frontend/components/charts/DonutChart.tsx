import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming } from 'react-native-reanimated';
import { COLORS } from '@/utils/constants';
import { fmtINR } from '@/utils/format';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Segment {
  label: string;
  value: number; // paise
  color: string;
}

interface Props {
  segments: Segment[];
  total: number;
  centerLabel?: string;
  size?: number;
}

export function DonutChart({ segments, total, centerLabel, size = 160 }: Props) {
  const R = size / 2 - 18;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * R;

  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(1, { duration: 900 });
  }, [segments.length]);

  let cumulativeAngle = -90; // start from top

  return (
    <View style={styles.wrapper}>
      <Svg width={size} height={size}>
        {/* Background track */}
        <Circle
          cx={cx} cy={cy} r={R}
          fill="none"
          stroke={COLORS.bgCardAlt}
          strokeWidth={18}
        />
        {segments.map((seg, i) => {
          const pct = total > 0 ? seg.value / total : 0;
          const dash = pct * circumference;
          const gap = circumference - dash;
          const rotation = cumulativeAngle;
          cumulativeAngle += pct * 360;

          return (
            <G key={i} rotation={rotation} origin={`${cx},${cy}`}>
              <Circle
                cx={cx} cy={cy} r={R}
                fill="none"
                stroke={seg.color}
                strokeWidth={18}
                strokeDasharray={`${dash} ${gap}`}
                strokeLinecap="round"
              />
            </G>
          );
        })}
      </Svg>

      {/* Center text */}
      <View style={[styles.center, { width: size, height: size }]}>
        <Text style={styles.centerValue}>{fmtINR(total, true)}</Text>
        {centerLabel && <Text style={styles.centerLabel}>{centerLabel}</Text>}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {segments.map((seg, i) => (
          <View key={i} style={styles.legendRow}>
            <View style={[styles.dot, { backgroundColor: seg.color }]} />
            <Text style={styles.legendLabel}>{seg.label}</Text>
            <Text style={styles.legendValue}>{((seg.value / total) * 100).toFixed(0)}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center' },
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerValue: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
  },
  centerLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  legend: { marginTop: 16, width: '100%', gap: 8 },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { flex: 1, color: COLORS.textSecondary, fontSize: 13 },
  legendValue: { color: COLORS.text, fontSize: 13, fontWeight: '600' },
});
