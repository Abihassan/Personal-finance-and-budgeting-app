import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop, Circle } from 'react-native-svg';
import Animated, { useSharedValue, withTiming, useAnimatedProps, Easing } from 'react-native-reanimated';
import { COLORS } from '@/utils/constants';
import { fmtINR } from '@/utils/format';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export interface WaveDataPoint {
  label: string;
  value: number; // paise
}

interface Props {
  data: WaveDataPoint[];
  height?: number;
  color?: string;
  gradientId?: string;
}

function buildPath(data: WaveDataPoint[], w: number, h: number, pad: number): string {
  if (data.length < 2) return '';
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const pts = data.map((d, i) => ({
    x: pad + (i / (data.length - 1)) * (w - pad * 2),
    y: pad + (1 - d.value / maxVal) * (h - pad * 2),
  }));

  let path = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const cp1x = pts[i].x + (pts[i + 1].x - pts[i].x) * 0.45;
    const cp1y = pts[i].y;
    const cp2x = pts[i + 1].x - (pts[i + 1].x - pts[i].x) * 0.45;
    const cp2y = pts[i + 1].y;
    path += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${pts[i + 1].x} ${pts[i + 1].y}`;
  }
  return path;
}

function buildFillPath(data: WaveDataPoint[], w: number, h: number, pad: number): string {
  const line = buildPath(data, w, h, pad);
  if (!line) return '';
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const lastX = pad + (w - pad * 2);
  const firstX = pad;
  return `${line} L ${lastX} ${h} L ${firstX} ${h} Z`;
}

export function WaveChart({ data, height = 160, color = COLORS.purple, gradientId = 'waveGrad' }: Props) {
  const W = 340;
  const PAD = 16;
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, { duration: 1000, easing: Easing.out(Easing.cubic) });
  }, [data.length]);

  const linePath = useMemo(() => buildPath(data, W, height, PAD), [data, height]);
  const fillPath = useMemo(() => buildFillPath(data, W, height, PAD), [data, height]);

  // Dots for each data point
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const dots = data.map((d, i) => ({
    x: PAD + (i / Math.max(data.length - 1, 1)) * (W - PAD * 2),
    y: PAD + (1 - d.value / maxVal) * (height - PAD * 2),
  }));

  return (
    <View>
      <Svg width="100%" height={height} viewBox={`0 0 ${W} ${height}`}>
        <Defs>
          <SvgGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity="0.3" />
            <Stop offset="1" stopColor={color} stopOpacity="0" />
          </SvgGradient>
        </Defs>

        {/* Fill */}
        {fillPath ? (
          <Path d={fillPath} fill={`url(#${gradientId})`} />
        ) : null}

        {/* Line */}
        {linePath ? (
          <Path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}

        {/* Dots */}
        {dots.map((dot, i) => (
          <Circle key={i} cx={dot.x} cy={dot.y} r={4} fill={color} stroke={COLORS.bg} strokeWidth={2} />
        ))}
      </Svg>

      {/* Labels */}
      <View style={styles.labels}>
        {data.map((d, i) => (
          <Text key={i} style={styles.label}>{d.label}</Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: -4,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 10,
  },
});
