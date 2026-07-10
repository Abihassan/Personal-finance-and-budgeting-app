import React, { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { DonutChart } from '@/components/charts/DonutChart';
import { TransactionRow } from '@/components/cards/TransactionRow';
import { CardSkeleton } from '@/components/common/Skeleton';
import { CategoryIcon } from '@/components/common/CategoryIcon';
import { budgetsApi, transactionsApi, reportsApi } from '@/api';
import { COLORS, GRADIENTS, QK, getCategoryById } from '@/utils/constants';
import { fmtINR } from '@/utils/format';

type Tab = 'Income' | 'Expenses' | 'Budget';

export default function PortfolioScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('Budget');
  const [refreshing, setRefreshing] = useState(false);

  const { data: breakdown, isLoading: loadBD, refetch: refetchBD } = useQuery({
    queryKey: QK.breakdown,
    queryFn: () => reportsApi.breakdown().then(r => r.data),
  });

  const { data: budgets, isLoading: loadBudgets, refetch: refetchBudgets } = useQuery({
    queryKey: QK.budgets,
    queryFn: () => budgetsApi.list().then(r => r.data),
  });

  const txType = activeTab === 'Income' ? 'income' : 'expense';
  const { data: txData, isLoading: loadTx, refetch: refetchTx } = useQuery({
    queryKey: QK.txs(activeTab === 'Budget' ? 'all' : txType),
    queryFn: () => transactionsApi.list(activeTab === 'Budget' ? undefined : txType, 30).then(r => r.data),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchBD(), refetchBudgets(), refetchTx()]);
    setRefreshing(false);
  };

  const budgetList: any[] = budgets?.budgets ?? [];
  const transactions: any[] = txData?.transactions ?? [];
  const recurringTxs = transactions.filter((t: any) => t.is_recurring);

  const incomeSegments = (breakdown?.income_by_category ?? []).map((c: any) => ({
    label: getCategoryById(c.category).label,
    value: c.total,
    color: getCategoryById(c.category).color,
  }));
  const totalIncome = incomeSegments.reduce((s: number, seg: any) => s + seg.value, 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.purple} />}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <Text style={styles.title}>Portfolio</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/modals/add-budget')}>
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </Animated.View>

        {/* Budget Breakdown */}
        <Animated.View entering={FadeInDown.duration(400).delay(80)} style={styles.card}>
          <Text style={styles.cardTitle}>Budget vs Spend</Text>
          {loadBD || loadBudgets ? <CardSkeleton /> : budgetList.map((budget: any) => {
            const cat = getCategoryById(budget.category);
            const spent = breakdown?.spend_by_category?.find((s: any) => s.category === budget.category)?.total ?? 0;
            const pct = Math.min((spent / budget.monthly_limit) * 100, 100);
            const over = spent > budget.monthly_limit;
            return (
              <View key={budget.id} style={styles.budgetRow}>
                <View style={styles.budgetHeader}>
                  <View style={styles.budgetLeft}>
                    <CategoryIcon icon={cat.icon} size={18} />
                    <Text style={styles.catLabel}>{cat.label}</Text>
                  </View>
                  <View style={styles.budgetRight}>
                    <Text style={[styles.spentText, { color: over ? COLORS.expense : COLORS.text }]}>
                      {fmtINR(spent, true)}
                    </Text>
                    <Text style={styles.limitText}> / {fmtINR(budget.monthly_limit, true)}</Text>
                  </View>
                </View>
                <View style={styles.progressBg}>
                  <LinearGradient
                    colors={over ? GRADIENTS.expense : GRADIENTS.brand}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={[styles.progressFill, { width: `${pct}%` as any }]}
                  />
                </View>
              </View>
            );
          })}
          {budgetList.length === 0 && !loadBD && (
            <TouchableOpacity style={styles.emptyInline} onPress={() => router.push('/modals/add-budget')}>
              <Text style={styles.emptyText}>+ Set up budgets</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Tab Selector */}
        <Animated.View entering={FadeInDown.duration(400).delay(160)} style={styles.tabs}>
          {(['Income', 'Expenses', 'Budget'] as Tab[]).map((t) => (
            <TouchableOpacity key={t} style={[styles.tab, activeTab === t && styles.tabActive]} onPress={() => setActiveTab(t)}>
              {activeTab === t ? (
                <LinearGradient colors={GRADIENTS.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.tabGrad}>
                  <Text style={styles.tabTextActive}>{t}</Text>
                </LinearGradient>
              ) : (
                <Text style={styles.tabText}>{t}</Text>
              )}
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* Tab Content */}
        <Animated.View entering={FadeInDown.duration(300).delay(200)} style={styles.card}>
          {activeTab === 'Income' && (
            <>
              <Text style={styles.cardTitle}>Income Sources</Text>
              {incomeSegments.length > 0
                ? <DonutChart segments={incomeSegments} total={totalIncome} centerLabel="Total Income" />
                : <Text style={styles.emptyText}>No income recorded</Text>
              }
            </>
          )}

          {activeTab === 'Expenses' && (
            <>
              <View style={styles.listHeader}>
                <Text style={styles.cardTitle}>Recurring</Text>
                <Text style={styles.count}>{recurringTxs.length} active</Text>
              </View>
              {loadTx ? <CardSkeleton /> : recurringTxs.length === 0
                ? <Text style={styles.emptyText}>No recurring expenses</Text>
                : recurringTxs.map((tx: any) => (
                  <TransactionRow key={tx.id} tx={tx} />
                ))
              }
            </>
          )}

          {activeTab === 'Budget' && (
            <>
              <View style={styles.listHeader}>
                <Text style={styles.cardTitle}>All Budgets</Text>
                <Text style={styles.count}>{budgetList.length} set</Text>
              </View>
              {budgetList.map((b: any) => (
                <TouchableOpacity
                  key={b.id}
                  style={styles.budgetItem}
                  onLongPress={async () => {
                    await budgetsApi.delete(b.id);
                    qc.invalidateQueries({ queryKey: QK.budgets });
                  }}
                  delayLongPress={600}
                >
                  <CategoryIcon icon={getCategoryById(b.category).icon} size={18} />
                  <Text style={styles.catLabel}>{getCategoryById(b.category).label}</Text>
                  <Text style={styles.limitText}>{fmtINR(b.monthly_limit, true)}/mo</Text>
                  <Ionicons name="trash-outline" size={14} color={COLORS.textMuted} />
                </TouchableOpacity>
              ))}
            </>
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
  card: { backgroundColor: COLORS.bgCard, borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  cardTitle: { color: COLORS.text, fontSize: 15, fontWeight: '700', marginBottom: 12 },
  budgetRow: { marginBottom: 16 },
  budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  budgetLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  budgetRight: { flexDirection: 'row', alignItems: 'center' },
  catLabel: { color: COLORS.text, fontSize: 13, fontWeight: '500' },
  spentText: { fontSize: 13, fontWeight: '700' },
  limitText: { color: COLORS.textSecondary, fontSize: 12 },
  progressBg: { height: 6, backgroundColor: COLORS.bgCardAlt, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tab: { flex: 1, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bgCard, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  tabActive: { borderColor: 'transparent' },
  tabGrad: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', borderRadius: 19 },
  tabText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '500' },
  tabTextActive: { color: '#fff', fontSize: 13, fontWeight: '700' },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  count: { color: COLORS.textMuted, fontSize: 12 },
  budgetItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  emptyText: { color: COLORS.textSecondary, fontSize: 14, textAlign: 'center', paddingVertical: 16 },
  emptyInline: { alignItems: 'center', paddingVertical: 20 },
  bottomPad: { height: 100 },
});
