import React, { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BarChart } from '@/components/charts/BarChart';
import { DonutChart } from '@/components/charts/DonutChart';
import { CardSkeleton } from '@/components/common/Skeleton';
import { CategoryIcon } from '@/components/common/CategoryIcon';
import { investmentsApi } from '@/api';
import { COLORS, GRADIENTS, QK, ICONS } from '@/utils/constants';
import { fmtINR, fmtPct } from '@/utils/format';

export default function InvestScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: QK.investments,
    queryFn: () => investmentsApi.list().then(r => r.data),
  });

  const investments: any[] = data?.investments ?? [];
  const totalValue = investments.reduce((s: number, inv: any) => s + inv.current_price * inv.quantity, 0);
  const totalCost  = investments.reduce((s: number, inv: any) => s + inv.avg_price    * inv.quantity, 0);
  const totalPL    = totalValue - totalCost;
  const totalPLPct = totalCost > 0 ? (totalPL / totalCost) * 100 : 0;

  const donutSegments = investments.map((inv: any) => ({
    label: inv.ticker,
    value: inv.current_price * inv.quantity,
    color: `hsl(${(inv.ticker.charCodeAt(0) * 47) % 360}, 70%, 60%)`,
  }));

  const earningsBar = data?.monthly_earnings ?? [];
  const onRefresh = async () => { setRefreshing(true); await refetch(); setRefreshing(false); };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.purple} />}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <Text style={styles.title}>Investments</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/modals/add-investment')}>
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </Animated.View>

        {/* Portfolio Summary */}
        <Animated.View entering={FadeInDown.duration(400).delay(80)}>
          <LinearGradient colors={GRADIENTS.brandDiag} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Portfolio Value</Text>
            <Text style={styles.summaryValue}>{fmtINR(totalValue)}</Text>
            <View style={styles.plRow}>
              <Text style={[styles.plText, { color: totalPL >= 0 ? COLORS.income : COLORS.expense }]}>
                {totalPL >= 0 ? '▲' : '▼'} {fmtINR(Math.abs(totalPL), true)}
              </Text>
              <View style={[styles.plBadge, { backgroundColor: totalPL >= 0 ? 'rgba(16,217,160,0.2)' : 'rgba(244,114,182,0.2)' }]}>
                <Text style={[styles.plPct, { color: totalPL >= 0 ? COLORS.income : COLORS.expense }]}>
                  {fmtPct(totalPLPct)}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Earnings Bar */}
        <Animated.View entering={FadeInDown.duration(400).delay(160)} style={styles.card}>
          <Text style={styles.cardTitle}>Monthly Earnings</Text>
          {isLoading ? <CardSkeleton /> : (
            <BarChart data={earningsBar.length ? earningsBar : [{ label: 'Now', value: 0, color: COLORS.income }]} height={160} />
          )}
        </Animated.View>

        {/* Allocation Donut */}
        {donutSegments.length > 0 && (
          <Animated.View entering={FadeInDown.duration(400).delay(240)} style={styles.card}>
            <Text style={styles.cardTitle}>Allocation</Text>
            <DonutChart segments={donutSegments} total={totalValue} centerLabel="Portfolio" />
          </Animated.View>
        )}

        {/* Holdings */}
        <Animated.View entering={FadeInDown.duration(400).delay(320)} style={styles.card}>
          <Text style={styles.cardTitle}>Holdings</Text>
          {isLoading ? <><CardSkeleton /><CardSkeleton /></> : investments.length === 0 ? (
            <View style={styles.empty}>
              <CategoryIcon icon={ICONS.invStocks} size={40} />
              <Text style={styles.emptyText}>No investments yet</Text>
              <TouchableOpacity onPress={() => router.push('/modals/add-investment')}>
                <Text style={styles.emptyBtn}>+ Add investment</Text>
              </TouchableOpacity>
            </View>
          ) : (
            investments.map((inv: any) => {
              const value = inv.current_price * inv.quantity;
              const cost  = inv.avg_price    * inv.quantity;
              const pl    = value - cost;
              const plPct = cost > 0 ? (pl / cost) * 100 : 0;
              return (
                <TouchableOpacity
                  key={inv.id}
                  style={styles.holdingRow}
                  onLongPress={async () => {
                    await investmentsApi.delete(inv.id);
                    qc.invalidateQueries({ queryKey: QK.investments });
                  }}
                  delayLongPress={600}
                >
                  <View style={styles.holdingLeft}>
                    <View style={[styles.tickerBadge, { backgroundColor: `hsl(${(inv.ticker.charCodeAt(0) * 47) % 360}, 70%, 20%)` }]}>
                      <Text style={styles.tickerText}>{inv.ticker.slice(0, 3)}</Text>
                    </View>
                    <View>
                      <Text style={styles.holdingTicker}>{inv.ticker}</Text>
                      <Text style={styles.holdingMeta}>{inv.type} · {inv.quantity} units</Text>
                    </View>
                  </View>
                  <View style={styles.holdingRight}>
                    <Text style={styles.holdingValue}>{fmtINR(value, true)}</Text>
                    <Text style={[styles.holdingPL, { color: pl >= 0 ? COLORS.income : COLORS.expense }]}>
                      {fmtPct(plPct)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </Animated.View>

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 8 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { color: COLORS.text, fontSize: 26, fontWeight: '800' },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.income, alignItems: 'center', justifyContent: 'center' },
  summaryCard: { borderRadius: 20, padding: 24, marginBottom: 16 },
  summaryLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 6 },
  summaryValue: { color: '#fff', fontSize: 32, fontWeight: '800', letterSpacing: -1, marginBottom: 8 },
  plRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  plText: { fontSize: 14, fontWeight: '600' },
  plBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  plPct: { fontSize: 12, fontWeight: '700' },
  card: { backgroundColor: COLORS.bgCard, borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  cardTitle: { color: COLORS.text, fontSize: 15, fontWeight: '700', marginBottom: 16 },
  holdingRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  holdingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tickerBadge: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tickerText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  holdingTicker: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  holdingMeta: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  holdingRight: { alignItems: 'flex-end' },
  holdingValue: { color: COLORS.text, fontSize: 14, fontWeight: '700' },
  holdingPL: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  empty: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyText: { color: COLORS.textSecondary, fontSize: 14 },
  emptyBtn: { color: COLORS.cyan, fontSize: 14, fontWeight: '600' },
  bottomPad: { height: 100 },
});
