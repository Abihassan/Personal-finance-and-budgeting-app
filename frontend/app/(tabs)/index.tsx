import React, { useState } from 'react';
import {
  RefreshControl, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/auth.store';
import { CardCarousel, type CardData } from '@/components/cards/CardCarousel';
import { NetWorthCard } from '@/components/cards/NetWorthCard';
import { CardSkeleton } from '@/components/common/Skeleton';
import { accountsApi, reportsApi } from '@/api';
import { COLORS, GRADIENTS, ICONS, QK, type NetWorthPeriod } from '@/utils/constants';
import { CategoryIcon } from '@/components/common/CategoryIcon';

const QUICK_ACTIONS = [
  { label: 'Add Transaction', icon: 'add-circle',  color: COLORS.purple, route: '/modals/add-transaction' },
  { label: 'Add Account',     icon: 'card',         color: COLORS.cyan,   route: '/modals/add-account' },
  { label: 'Add Budget',      icon: 'wallet',       color: '#F59E0B',     route: '/modals/add-budget' },
  { label: 'Add Investment',  icon: 'trending-up',  color: COLORS.income, route: '/modals/add-investment' },
] as const;

export default function HomeScreen() {
  const router   = useRouter();
  const qc       = useQueryClient();
  const { user } = useAuthStore();

  const [period, setPeriod]           = useState<NetWorthPeriod>('1M');
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [refreshing, setRefreshing]   = useState(false);

  const { data: accounts, isLoading: loadAcc, refetch: refetchAcc } = useQuery({
    queryKey: QK.accounts,
    queryFn: () => accountsApi.list().then(r => r.data),
  });

  const { data: nwData, isLoading: loadNW, refetch: refetchNW } = useQuery({
    queryKey: QK.netWorth(period),
    queryFn: () => reportsApi.netWorth(period).then(r => r.data),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchAcc(), refetchNW()]);
    setRefreshing(false);
  };

  // Map accounts to CardData shape
  const cards: CardData[] = (accounts ?? []).map((a: any) => ({
    id:                a.id,
    bank_name:         a.bank_name,
    card_number_last4: a.card_number_last4,
    balance:           a.balance,
    expiry:            a.expiry,
    is_asset:          a.is_asset,
    card_type:         a.is_asset ? 'Debit' : 'Credit',
  }));

  const activeCard = cards[activeCardIndex];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.purple}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ──────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning,</Text>
            <Text style={styles.name}>
              {user?.name?.split(' ')[0] ?? 'there'} 👋
            </Text>
          </View>
          <TouchableOpacity style={styles.avatarBtn}>
            <LinearGradient colors={GRADIENTS.brand} style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.name?.[0]?.toUpperCase() ?? 'S'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* ── Card Carousel ────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(400).delay(80)}>
          {loadAcc ? (
            <CardSkeleton />
          ) : (
            <CardCarousel
              cards={cards}
              activeIndex={activeCardIndex}
              onActiveChange={(idx) => setActiveCardIndex(idx)}
              onAddCard={() => router.push('/modals/add-account')}
            />
          )}
        </Animated.View>

        {/* ── Active card context strip ────────────────────────── */}
        {activeCard && (
          <Animated.View
            entering={FadeInDown.duration(300).delay(120)}
            style={styles.contextStrip}
          >
            <View style={styles.contextItem}>
              <Text style={styles.contextLabel}>Card</Text>
              <Text style={styles.contextValue} numberOfLines={1}>
                •••• {activeCard.card_number_last4}
              </Text>
            </View>
            <View style={styles.contextDivider} />
            <View style={styles.contextItem}>
              <Text style={styles.contextLabel}>Balance</Text>
              <Text style={[
                styles.contextValue,
                { color: activeCard.is_asset ? COLORS.income : COLORS.expense },
              ]}>
                {/* fmtINR shown in carousel strip — here show short form */}
                {activeCard.is_asset ? '▲' : '▼'} {activeCard.bank_name}
              </Text>
            </View>
            <View style={styles.contextDivider} />
            <View style={styles.contextItem}>
              <Text style={styles.contextLabel}>Type</Text>
              <Text style={styles.contextValue}>
                {activeCard.card_type ?? (activeCard.is_asset ? 'Debit' : 'Credit')}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* ── Net Worth ────────────────────────────────────────── */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(200)}
          style={styles.section}
        >
          {loadNW ? (
            <CardSkeleton />
          ) : (
            <NetWorthCard
              netWorth={nwData?.net_worth ?? 0}
              change={nwData?.change ?? 0}
              changePct={nwData?.change_pct ?? 0}
              history={nwData?.history ?? []}
              period={period}
              onPeriodChange={setPeriod}
            />
          )}
        </Animated.View>

        {/* ── Quick Actions ────────────────────────────────────── */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(280)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.grid}>
            {QUICK_ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.label}
                style={styles.actionCard}
                onPress={() => {
                  // Pass the active card id as a param to the transaction modal
                  if (action.route === '/modals/add-transaction' && activeCard) {
                    router.push({
                      pathname: '/modals/add-transaction',
                      params: { accountId: activeCard.id },
                    } as any);
                  } else {
                    router.push(action.route as any);
                  }
                }}
                activeOpacity={0.75}
              >
                <View style={[
                  styles.actionIcon,
                  { backgroundColor: `${action.color}20` },
                ]}>
                  <Ionicons name={action.icon as any} size={24} color={action.color} />
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* ── Ask Sequro Banner ────────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(400).delay(360)}>
          <TouchableOpacity
            onPress={() => router.push('/modals/ask-sequro')}
            activeOpacity={0.85}
            style={styles.seqBannerWrapper}
          >
            <LinearGradient
              colors={['rgba(124,58,237,0.25)', 'rgba(0,188,212,0.25)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.seqBanner}
            >
              <View style={styles.seqLeft}>
                <View style={styles.seqPulse}>
                  <CategoryIcon icon={ICONS.aiSparkle} size={22} />
                </View>
                <View>
                  <Text style={styles.seqTitle}>Ask Sequro</Text>
                  <Text style={styles.seqSub}>Your AI financial advisor</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.cyan} />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: COLORS.bg },
  container: { flex: 1 },
  content:   { paddingHorizontal: 20, paddingTop: 8 },

  // Header
  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greeting:   { color: COLORS.textSecondary, fontSize: 14 },
  name:       { color: COLORS.text, fontSize: 22, fontWeight: '700' },
  avatarBtn:  {},
  avatar:     { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '700' },

  // Context strip
  contextStrip: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgCard,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 4,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  contextItem:    { flex: 1, alignItems: 'center' },
  contextLabel:   { color: COLORS.textMuted, fontSize: 10, fontWeight: '500', marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.5 },
  contextValue:   { color: COLORS.text, fontSize: 12, fontWeight: '700' },
  contextDivider: { width: 1, height: 28, backgroundColor: COLORS.border },

  // Sections
  section:      { marginTop: 8 },
  sectionTitle: { color: COLORS.text, fontSize: 16, fontWeight: '700', marginBottom: 12 },

  // Quick actions grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionCard: {
    width: '47%', backgroundColor: COLORS.bgCard, borderRadius: 18,
    padding: 16, borderWidth: 1, borderColor: COLORS.border, gap: 10,
  },
  actionIcon:  { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { color: COLORS.text, fontSize: 13, fontWeight: '600' },

  // Ask Sequro
  seqBannerWrapper: { marginTop: 16 },
  seqBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 18, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(124,58,237,0.3)',
  },
  seqLeft:  { flexDirection: 'row', alignItems: 'center', gap: 14 },
  seqPulse: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(124,58,237,0.25)', alignItems: 'center', justifyContent: 'center',
  },

  seqTitle: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
  seqSub:   { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },

  bottomPad: { height: 100 },
});
