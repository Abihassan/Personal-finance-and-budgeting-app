import React, { useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WaveChart } from '@/components/charts/WaveChart';
import { TransactionRow } from '@/components/cards/TransactionRow';
import { CardSkeleton } from '@/components/common/Skeleton';
import { CategoryIcon } from '@/components/common/CategoryIcon';
import { transactionsApi } from '@/api';
import { COLORS, QK, ICONS } from '@/utils/constants';
import { fmtINR } from '@/utils/format';

export default function SpendScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: QK.txs('expense'),
    queryFn: () => transactionsApi.list('expense', 50).then(r => r.data),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const transactions: any[] = data?.transactions ?? [];
  const monthlyData: { label: string; value: number }[] = data?.monthly_chart ?? [];
  const weeklyTotal: number = data?.weekly_total ?? 0;
  const monthTotal: number = data?.month_total ?? 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.purple} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <Text style={styles.title}>Spending</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/modals/add-transaction')}>
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </Animated.View>

        {/* Summary Row */}
        <Animated.View entering={FadeInDown.duration(400).delay(80)} style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>This Month</Text>
            <Text style={[styles.summaryValue, { color: COLORS.expense }]}>{fmtINR(monthTotal, true)}</Text>
          </View>
          <View style={[styles.summaryCard, { flex: 1 }]}>
            <Text style={styles.summaryLabel}>This Week</Text>
            <Text style={[styles.summaryValue, { color: COLORS.expense }]}>{fmtINR(weeklyTotal, true)}</Text>
          </View>
        </Animated.View>

        {/* Wave Chart */}
        <Animated.View entering={FadeInDown.duration(400).delay(160)} style={styles.chartCard}>
          <Text style={styles.cardTitle}>Monthly Spend</Text>
          {isLoading ? (
            <CardSkeleton />
          ) : (
            <WaveChart data={monthlyData.length ? monthlyData : [{ label: 'Now', value: 0 }]} height={140} color={COLORS.expense} />
          )}
        </Animated.View>

        {/* Recent Transactions */}
        <Animated.View entering={FadeInDown.duration(400).delay(240)} style={styles.listCard}>
          <View style={styles.listHeader}>
            <Text style={styles.cardTitle}>Recent Expenses</Text>
            <Text style={styles.count}>{transactions.length} entries</Text>
          </View>

          {isLoading ? (
            <>
              <CardSkeleton />
              <CardSkeleton />
            </>
          ) : transactions.length === 0 ? (
            <View style={styles.empty}>
              <CategoryIcon icon={ICONS.emptySpend} size={40} />
              <Text style={styles.emptyText}>No expenses yet</Text>
              <TouchableOpacity onPress={() => router.push('/modals/add-transaction')} style={styles.emptyBtn}>
                <Text style={styles.emptyBtnText}>+ Add one</Text>
              </TouchableOpacity>
            </View>
          ) : (
            transactions.map((tx: any) => (
              <TransactionRow
                key={tx.id}
                tx={tx}
                onLongPress={async (id) => {
                  await transactionsApi.delete(id);
                  qc.invalidateQueries({ queryKey: QK.txs('expense') });
                }}
              />
            ))
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
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.purple, alignItems: 'center', justifyContent: 'center' },
  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  summaryCard: { backgroundColor: COLORS.bgCard, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border, flex: 1 },
  summaryLabel: { color: COLORS.textSecondary, fontSize: 12, marginBottom: 6 },
  summaryValue: { fontSize: 20, fontWeight: '800' },
  chartCard: { backgroundColor: COLORS.bgCard, borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  cardTitle: { color: COLORS.text, fontSize: 15, fontWeight: '700', marginBottom: 12 },
  listCard: { backgroundColor: COLORS.bgCard, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  count: { color: COLORS.textMuted, fontSize: 12 },
  empty: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyText: { color: COLORS.textSecondary, fontSize: 14 },
  emptyBtn: { marginTop: 4 },
  emptyBtnText: { color: COLORS.cyan, fontSize: 14, fontWeight: '600' },
  bottomPad: { height: 100 },
});
