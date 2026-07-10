import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { COLORS, NET_WORTH_PERIODS, type NetWorthPeriod } from '@/utils/constants';
import { fmtINR, fmtPct } from '@/utils/format';
import { WaveChart, type WaveDataPoint } from '@/components/charts/WaveChart';

interface Props {
  netWorth: number; // paise
  change: number;   // paise delta
  changePct: number;
  history: WaveDataPoint[];
  period: NetWorthPeriod;
  onPeriodChange: (p: NetWorthPeriod) => void;
}

export function NetWorthCard({ netWorth, change, changePct, history, period, onPeriodChange }: Props) {
  const isPositive = change >= 0;

  return (
    <View style={styles.card}>
      <LinearGradient colors={['#1A1A35', '#12122A']} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.label}>Net Worth</Text>
          <View style={[styles.changeBadge, { backgroundColor: isPositive ? 'rgba(16,217,160,0.15)' : 'rgba(244,114,182,0.15)' }]}>
            <Text style={[styles.changeText, { color: isPositive ? COLORS.income : COLORS.expense }]}>
              {fmtPct(changePct)}
            </Text>
          </View>
        </View>

        {/* Value */}
        <Text style={styles.value}>{fmtINR(netWorth)}</Text>
        <Text style={[styles.delta, { color: isPositive ? COLORS.income : COLORS.expense }]}>
          {isPositive ? '▲' : '▼'} {fmtINR(Math.abs(change), true)} this period
        </Text>

        {/* Wave Chart */}
        <View style={styles.chart}>
          <WaveChart data={history} height={80} color={isPositive ? COLORS.income : COLORS.expense} />
        </View>

        {/* Period Pills */}
        <View style={styles.pills}>
          {NET_WORTH_PERIODS.map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.pill, period === p && styles.pillActive]}
              onPress={() => onPeriodChange(p)}
            >
              {period === p ? (
                <LinearGradient colors={['#7C3AED', '#00BCD4']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.pillGrad}>
                  <Text style={styles.pillTextActive}>{p}</Text>
                </LinearGradient>
              ) : (
                <Text style={styles.pillText}>{p}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, overflow: 'hidden', marginBottom: 16 },
  gradient: { borderRadius: 20, padding: 20, borderWidth: 1, borderColor: COLORS.border },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  label: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '500' },
  changeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  changeText: { fontSize: 12, fontWeight: '600' },
  value: { color: COLORS.text, fontSize: 32, fontWeight: '800', letterSpacing: -1, marginBottom: 4 },
  delta: { fontSize: 13, fontWeight: '500', marginBottom: 12 },
  chart: { marginHorizontal: -8, marginBottom: 16 },
  pills: { flexDirection: 'row', gap: 8 },
  pill: {
    flex: 1,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgCardAlt,
    overflow: 'hidden',
  },
  pillActive: {},
  pillGrad: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', borderRadius: 16 },
  pillText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600' },
  pillTextActive: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
