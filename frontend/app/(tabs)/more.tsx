import React, { useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BarChart } from '@/components/charts/BarChart';
import { CardSkeleton } from '@/components/common/Skeleton';
import { reportsApi } from '@/api';
import { AuthService } from '@/auth/auth.service';
import { useAuthStore } from '@/store/auth.store';
import { COLORS, GRADIENTS, QK, ICONS } from '@/utils/constants';
import { fmtINR } from '@/utils/format';
import { CategoryIcon } from '@/components/common/CategoryIcon';

const EXPERT_TIPS = [
  { icon: ICONS.tipEmergency,  title: 'Emergency Fund First', body: 'Keep 3–6 months of expenses in a liquid account before aggressive investing.' },
  { icon: ICONS.tipAllocation, title: '50/30/20 Rule', body: 'Allocate 50% to needs, 30% to wants, and 20% to savings and investments.' },
  { icon: ICONS.tipSip,        title: 'SIP Over Lump Sum', body: 'Systematic investment plans average out market volatility over time.' },
  { icon: ICONS.tipInsurance,  title: 'Insurance First', body: 'Term insurance and health cover protect your wealth before you grow it.' },
];

export default function MoreScreen() {
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: QK.transfers,
    queryFn: () => reportsApi.transfers().then(r => r.data),
  });

  const onRefresh = async () => { setRefreshing(true); await refetch(); setRefreshing(false); };

  const transferData = (data?.monthly ?? []).map((m: any) => ({
    label: m.month,
    value: m.income,
    value2: m.expense,
    color: COLORS.income,
    color2: COLORS.expense,
  }));

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => AuthService.logout() },
    ]);
  };

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
          <View>
            <Text style={styles.title}>More</Text>
            <Text style={styles.sub}>{user?.email}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={20} color={COLORS.expense} />
          </TouchableOpacity>
        </Animated.View>

        {/* Transfer Report */}
        <Animated.View entering={FadeInDown.duration(400).delay(80)} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Monthly Transfers</Text>
            <View style={styles.legend}>
              <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: COLORS.income }]} /><Text style={styles.legendText}>In</Text></View>
              <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: COLORS.expense }]} /><Text style={styles.legendText}>Out</Text></View>
            </View>
          </View>
          {isLoading ? <CardSkeleton /> : (
            <BarChart
              data={transferData.length ? transferData : [{ label: 'Jan', value: 0, value2: 0 }]}
              height={180}
              grouped={true}
            />
          )}
          {data && (
            <View style={styles.transferSummary}>
              <View style={styles.transferStat}>
                <Text style={styles.transferLabel}>Total In</Text>
                <Text style={[styles.transferValue, { color: COLORS.income }]}>{fmtINR(data.total_income ?? 0, true)}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.transferStat}>
                <Text style={styles.transferLabel}>Total Out</Text>
                <Text style={[styles.transferValue, { color: COLORS.expense }]}>{fmtINR(data.total_expense ?? 0, true)}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.transferStat}>
                <Text style={styles.transferLabel}>Net</Text>
                <Text style={[styles.transferValue, { color: (data.total_income ?? 0) >= (data.total_expense ?? 0) ? COLORS.income : COLORS.expense }]}>
                  {fmtINR(Math.abs((data.total_income ?? 0) - (data.total_expense ?? 0)), true)}
                </Text>
              </View>
            </View>
          )}
        </Animated.View>

        {/* Expert Advice */}
        <Animated.View entering={FadeInDown.duration(400).delay(160)}>
          <Text style={styles.sectionTitle}>Expert Advice</Text>
          {EXPERT_TIPS.map((tip, i) => (
            <Animated.View key={i} entering={FadeInDown.duration(300).delay(200 + i * 60)} style={styles.tipCard}>
              <LinearGradient
                colors={['rgba(124,58,237,0.1)', 'rgba(0,188,212,0.05)']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.tipGrad}
              >
                <View style={styles.tipIcon}>
                  <CategoryIcon icon={tip.icon} size={22} />
                </View>
                <View style={styles.tipContent}>
                  <Text style={styles.tipTitle}>{tip.title}</Text>
                  <Text style={styles.tipBody}>{tip.body}</Text>
                </View>
              </LinearGradient>
            </Animated.View>
          ))}
        </Animated.View>

        {/* App Info */}
        <Animated.View entering={FadeInDown.duration(400).delay(480)} style={styles.appInfo}>
          <LinearGradient colors={GRADIENTS.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.appInfoGrad}>
            <Text style={styles.appInfoName}>Sequro v1.0</Text>
          </LinearGradient>
          <Text style={styles.appInfoSub}>Personal Finance · AI Powered</Text>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { color: COLORS.text, fontSize: 26, fontWeight: '800' },
  sub: { color: COLORS.textSecondary, fontSize: 13, marginTop: 2 },
  logoutBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(244,114,182,0.12)', alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: COLORS.bgCard, borderRadius: 20, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: COLORS.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
  legend: { flexDirection: 'row', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: COLORS.textSecondary, fontSize: 12 },
  transferSummary: { flexDirection: 'row', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: COLORS.border },
  transferStat: { flex: 1, alignItems: 'center' },
  transferLabel: { color: COLORS.textSecondary, fontSize: 11, marginBottom: 4 },
  transferValue: { fontSize: 14, fontWeight: '700' },
  divider: { width: 1, backgroundColor: COLORS.border, marginHorizontal: 8 },
  sectionTitle: { color: COLORS.text, fontSize: 16, fontWeight: '700', marginBottom: 12 },
  tipCard: { marginBottom: 12, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(124,58,237,0.2)' },
  tipGrad: { flexDirection: 'row', padding: 16, gap: 14, alignItems: 'flex-start' },
  tipIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(124,58,237,0.15)', alignItems: 'center', justifyContent: 'center' },
  tipContent: { flex: 1 },
  tipTitle: { color: COLORS.text, fontSize: 14, fontWeight: '700', marginBottom: 4 },
  tipBody: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 19 },
  appInfo: { alignItems: 'center', marginTop: 8 },
  appInfoGrad: { paddingHorizontal: 20, paddingVertical: 6, borderRadius: 20, marginBottom: 6 },
  appInfoName: { color: '#fff', fontSize: 13, fontWeight: '700' },
  appInfoSub: { color: COLORS.textMuted, fontSize: 12 },
  bottomPad: { height: 100 },
});
