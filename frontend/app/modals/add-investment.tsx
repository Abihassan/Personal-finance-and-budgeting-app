import React, { useState } from 'react';
import {
  KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Header } from '@/components/common/Header';
import { FormField } from '@/components/common/FormField';
import { GradientButton } from '@/components/common/GradientButton';
import { CategoryIcon } from '@/components/common/CategoryIcon';
import { investmentsApi } from '@/api';
import { COLORS, GRADIENTS, INVESTMENT_TYPES, QK } from '@/utils/constants';
import { rupeesToPaise, fmtINR, fmtPct } from '@/utils/format';

export default function AddInvestmentModal() {
  const router = useRouter();
  const qc = useQueryClient();

  const [invType, setInvType] = useState('stocks');
  const [ticker, setTicker] = useState('');
  const [quantity, setQuantity] = useState('');
  const [avgPrice, setAvgPrice] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Live P&L calculation
  const qty = parseFloat(quantity) || 0;
  const avg = parseFloat(avgPrice) || 0;
  const cur = parseFloat(currentPrice) || 0;
  const invested = qty * avg;
  const current  = qty * cur;
  const pl       = current - invested;
  const plPct    = invested > 0 ? (pl / invested) * 100 : 0;
  const isProfit = pl >= 0;

  const handleSave = async () => {
    if (!ticker.trim()) { setError('Ticker/name is required'); return; }
    if (!quantity || qty <= 0) { setError('Enter a valid quantity'); return; }
    if (!avgPrice || avg <= 0) { setError('Enter avg buy price'); return; }
    if (!currentPrice || cur <= 0) { setError('Enter current price'); return; }
    setError('');
    setLoading(true);
    try {
      await investmentsApi.create({
        ticker: ticker.trim().toUpperCase(),
        type: invType,
        quantity: qty,
        avg_price: rupeesToPaise(avgPrice),
        current_price: rupeesToPaise(currentPrice),
      });
      qc.invalidateQueries({ queryKey: QK.investments });
      router.back();
    } catch (e: any) {
      setError(e.response?.data?.detail ?? 'Failed to save investment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Header title="Add Investment" onClose={() => router.back()} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Type Grid */}
          <Animated.View entering={FadeInDown.duration(300)} style={styles.section}>
            <Text style={styles.sectionLabel}>Investment Type</Text>
            <View style={styles.typeGrid}>
              {INVESTMENT_TYPES.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.typeCard, invType === t.id && styles.typeCardActive]}
                  onPress={() => { Haptics.selectionAsync(); setInvType(t.id); }}
                >
                  <CategoryIcon icon={t.icon} size={28} />
                  <Text style={[styles.typeLabel, invType === t.id && styles.typeLabelActive]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(300).delay(80)}>
            <FormField label="Ticker / Name (e.g. RELIANCE)" value={ticker} onChangeText={setTicker} autoCapitalize="characters" />
            <FormField label="Quantity / Units" value={quantity} onChangeText={setQuantity} keyboardType="decimal-pad" />
            <FormField label="Avg Buy Price (₹)" value={avgPrice} onChangeText={setAvgPrice} keyboardType="decimal-pad" />
            <FormField label="Current Price (₹)" value={currentPrice} onChangeText={setCurrentPrice} keyboardType="decimal-pad" />
          </Animated.View>

          {/* Live P&L Preview */}
          {(invested > 0 || current > 0) && (
            <Animated.View entering={FadeInDown.duration(300)} style={styles.plCard}>
              <LinearGradient
                colors={isProfit ? ['rgba(16,217,160,0.1)', 'rgba(16,217,160,0.05)'] : ['rgba(244,114,182,0.1)', 'rgba(244,114,182,0.05)']}
                style={styles.plGrad}
              >
                <Text style={styles.plTitle}>Live P&L Preview</Text>
                <View style={styles.plRow}>
                  <View style={styles.plStat}>
                    <Text style={styles.plLabel}>Invested</Text>
                    <Text style={styles.plValue}>{fmtINR(rupeesToPaise(String(invested)), true)}</Text>
                  </View>
                  <View style={styles.plStat}>
                    <Text style={styles.plLabel}>Current</Text>
                    <Text style={styles.plValue}>{fmtINR(rupeesToPaise(String(current)), true)}</Text>
                  </View>
                  <View style={styles.plStat}>
                    <Text style={styles.plLabel}>P&L</Text>
                    <Text style={[styles.plBig, { color: isProfit ? COLORS.income : COLORS.expense }]}>
                      {isProfit ? '+' : ''}{fmtINR(rupeesToPaise(String(pl)), true)}
                    </Text>
                    <Text style={[styles.plPct, { color: isProfit ? COLORS.income : COLORS.expense }]}>
                      {fmtPct(plPct)}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </Animated.View>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <GradientButton label="Save Investment" onPress={handleSave} loading={loading} style={styles.saveBtn} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  section: { marginBottom: 20 },
  sectionLabel: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '500', marginBottom: 12 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  typeCard: {
    width: '30%', paddingVertical: 14, borderRadius: 16, alignItems: 'center',
    justifyContent: 'center', gap: 6, backgroundColor: COLORS.bgCard,
    borderWidth: 1, borderColor: COLORS.border,
  },
  typeCardActive: { borderColor: COLORS.purple, backgroundColor: 'rgba(124,58,237,0.15)' },
  typeLabel: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '500' },
  typeLabelActive: { color: COLORS.purpleLight },
  plCard: { borderRadius: 16, overflow: 'hidden', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(16,217,160,0.2)' },
  plGrad: { padding: 16 },
  plTitle: { color: COLORS.text, fontSize: 13, fontWeight: '700', marginBottom: 12 },
  plRow: { flexDirection: 'row', gap: 8 },
  plStat: { flex: 1, alignItems: 'center' },
  plLabel: { color: COLORS.textSecondary, fontSize: 11, marginBottom: 4 },
  plValue: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  plBig: { fontSize: 16, fontWeight: '800' },
  plPct: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  error: { color: COLORS.expense, fontSize: 13, marginBottom: 12, textAlign: 'center' },
  saveBtn: {},
});
