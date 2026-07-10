import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Rect, G, Text as SvgText } from 'react-native-svg';
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedProps,
  Easing,
} from 'react-native-reanimated';
import { COLORS } from '@/utils/constants';
import { fmtINR } from '@/utils/format';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

export interface BarDataPoint {
  label: string;
  value: number;       // paise
  value2?: number;     // paise — for grouped (in vs out)
  color?: string;
  color2?: string;
}

interface Props {
  data: BarDataPoint[];
  height?: number;
  showGrid?: boolean;
  grouped?: boolean;  // render two bars side by side
}

function AnimatedBar({
  x, y, width, height, color, delay,
}: {
  x: number; y: number; width: number; height: number; color: string; delay: number;
}) {
  const animH = useSharedValue(0);
  const animY = useSharedValue(y + height);

  useEffect(() => {
    const t = setTimeout(() => {
      animH.value = withTiming(height, { duration: 600, easing: Easing.out(Easing.cubic) });
      animY.value = withTiming(y, { duration: 600, easing: Easing.out(Easing.cubic) });
    }, delay);
    return () => clearTimeout(t);
  }, [height]);

  const props = useAnimatedProps(() => ({
    height: animH.value,
    y: animY.value,
  }));

  return (
    <AnimatedRect
      x={x}
      width={width}
      rx={5}
      fill={color}
      animatedProps={props}
    />
  );
}

export function BarChart({ data, height = 180, showGrid = true, grouped = false }: Props) {
  const PADDING = { top: 16, bottom: 32, left: 8, right: 8 };
  const chartH = height - PADDING.top - PADDING.bottom;
  const maxVal = Math.max(...data.flatMap(d => grouped ? [d.value, d.value2 ?? 0] : [d.value]), 1);
  const totalW = 320;
  const barGroupW = (totalW - PADDING.left - PADDING.right) / data.length;

  return (
    <View>
      <Svg width="100%" height={height} viewBox={`0 0 320 ${height}`}>
        {/* Grid lines */}
        {showGrid && [0.25, 0.5, 0.75, 1].map((pct) => {
          const gy = PADDING.top + chartH * (1 - pct);
          return (
            <G key={pct}>
              <Rect x={PADDING.left} y={gy} width={totalW - PADDING.left - PADDING.right} height={0.5} fill={COLORS.border} />
            </G>
          );
        })}

        {data.map((bar, i) => {
          const groupX = PADDING.left + i * barGroupW;
          const bw = grouped ? barGroupW * 0.35 : barGroupW * 0.5;
          const centerX = groupX + (barGroupW - (grouped ? bw * 2 + 4 : bw)) / 2;

          const h1 = (bar.value / maxVal) * chartH;
          const y1 = PADDING.top + chartH - h1;

          const h2 = grouped && bar.value2 ? (bar.value2 / maxVal) * chartH : 0;
          const y2 = PADDING.top + chartH - h2;

          return (
            <G key={i}>
              <AnimatedBar
                x={centerX}
                y={y1}
                width={bw}
                height={h1}
                color={bar.color ?? COLORS.purple}
                delay={i * 60}
              />
              {grouped && bar.value2 !== undefined && (
                <AnimatedBar
                  x={centerX + bw + 4}
                  y={y2}
                  width={bw}
                  height={h2}
                  color={bar.color2 ?? COLORS.cyan}
                  delay={i * 60 + 30}
                />
              )}
              <SvgText
                x={groupX + barGroupW / 2}
                y={height - 6}
                textAnchor="middle"
                fontSize={10}
                fill={COLORS.textSecondary}
              >
                {bar.label}
              </SvgText>
            </G>
          );
        })}
      </Svg>

      {grouped && (
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: COLORS.purple }]} />
            <Text style={styles.legendText}>In</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: COLORS.cyan }]} />
            <Text style={styles.legendText}>Out</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  legend: { flexDirection: 'row', gap: 16, marginTop: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: COLORS.textSecondary, fontSize: 12 },
});
