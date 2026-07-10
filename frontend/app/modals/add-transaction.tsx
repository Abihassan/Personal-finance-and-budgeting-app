import React, { useState } from 'react';
import {
  KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Switch, Text, TouchableOpacity, View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Header } from '@/components/common/Header';
import { FormField } from '@/components/common/FormField';
import { GradientButton } from '@/components/common/GradientButton';
import { CategoryChips } from '@/components/common/CategoryChips';
import { CARD_THEMES } from '@/components/cards/BankCard';
import { accountsApi, transactionsApi } from '@/api';
import { COLORS, GRADIENTS, QK, ICONS } from '@/utils/constants';
import { CategoryIcon } from '@/components/common/CategoryIcon';
import { rupeesToPaise, fmtINR } from '@/utils/format';

export default function AddTransactionModal() {
  const router  = useRouter();
  const qc      = useQueryClient();
  const params  = useLocalSearchParams<{ accountId?: string }>();

  const [type,      setType]      = useState<'expense' | 'income'>('expense');
  const [title,     setTitle]     = useState('');
  const [amount,    setAmount]    = useState('');
  const [category,  setCategory]  = useState('food');
  const [merchant,  setMerchant]  = useState('');
  const [recurring, setRecurring] = useState(false);
  const [accountId, setAccountId] = useState<string | undefined>(params.accountId);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [showPicker, setShowPicker] = useState(false);

  // Fetch accounts so user can select/switch which card this transaction is for
  const { data: accounts } = useQuery({
    queryKey: QK.accounts,
    queryFn: () => accountsApi.list().then(r => r.data),
  });

  const accountList: any[] = accounts ?? [];
  const selectedAccount = accountList.find((a: any) => a.id === accountId) ?? accountList[0];

  const handleSave = async () => {
    if (!title.trim()) { setError('Title is required'); return; }
    if (!amount || isNaN(parseFloat(amount))) { setError('Enter a valid amount'); return; }
    setError('');
    setLoading(true);
    try {
      await transactionsApi.create({
        title:        title.trim(),
        amount:       rupeesToPaise(amount),
        category,
        type,
        merchant:     merchant.trim() || undefined,
        is_recurring: recurring,
        date:         new Date().toISOString(),
        account_id:   selectedAccount?.id,
      });
      qc.invalidateQueries({ queryKey: QK.txs('expense') });
      qc.invalidateQueries({ queryKey: QK.txs('income') });
      qc.invalidateQueries({ queryKey: QK.breakdown });
      qc.invalidateQueries({ queryKey: QK.transfers });
      router.back();
    } catch (e: any) {
      setError(e.response?.data?.detail ?? 'Failed to save transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Header title="Add Transaction" onClose={() => router.back()} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ── Type Toggle ─────────────────────────────────── */}
          <Animated.View entering={FadeInDown.duration(300)} style={styles.typeRow}>
            {(['expense', 'income'] as const).map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.typeBtn, type === t && styles.typeBtnActive]}
                onPress={() => { Haptics.selectionAsync(); setType(t); }}
              >
                {type === t ? (
                  <LinearGradient
                    colors={t === 'expense' ? GRADIENTS.expense : GRADIENTS.income}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.typeGrad}
                  >
                    <View style={styles.typeInner}>
                      <CategoryIcon
                        icon={t === 'expense' ? ICONS.toggleExpense : ICONS.toggleIncome}
                        size={18}
                      />
                      <Text style={styles.typeTextActive}>
                        {t === 'expense' ? 'Expense' : 'Income'}
                      </Text>
                    </View>
                  </LinearGradient>
                ) : (
                  <View style={styles.typeInner}>
                    <CategoryIcon
                      icon={t === 'expense' ? ICONS.toggleExpense : ICONS.toggleIncome}
                      size={18}
                    />
                    <Text style={styles.typeText}>
                      {t === 'expense' ? 'Expense' : 'Income'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </Animated.View>

          {/* ── Amount display ───────────────────────────────── */}
          <Animated.View
            entering={FadeInDown.duration(300).delay(60)}
            style={styles.amountWrap}
          >
            <Text style={styles.rupeeSym}>₹</Text>
            <Text style={styles.amountDisplay}>{amount || '0'}</Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(300).delay(90)}
            style={styles.amountFieldWrap}
          >
            <FormField
              label="Amount (₹)"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />
          </Animated.View>

          {/* ── Card selector ────────────────────────────────── */}
          {accountList.length > 0 && (
            <Animated.View
              entering={FadeInDown.duration(300).delay(105)}
              style={styles.section}
            >
              <Text style={styles.sectionLabel}>Charge to card</Text>

              <TouchableOpacity
                style={styles.cardSelector}
                onPress={() => setShowPicker(!showPicker)}
                activeOpacity={0.8}
              >
                {/* Mini card colour indicator */}
                <LinearGradient
                  colors={
                    CARD_THEMES[
                      accountList.findIndex((a: any) => a.id === selectedAccount?.id) %
                      CARD_THEMES.length
                    ]?.gradient ?? CARD_THEMES[0].gradient
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cardDot}
                />
                <View style={styles.cardSelectorInfo}>
                  <Text style={styles.cardSelectorBank}>
                    {selectedAccount?.bank_name ?? 'Select card'}
                  </Text>
                  <Text style={styles.cardSelectorNum}>
                    •••• {selectedAccount?.card_number_last4 ?? '----'}
                    {' · '}
                    {fmtINR(selectedAccount?.balance ?? 0)}
                  </Text>
                </View>
                <Ionicons
                  name={showPicker ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={COLORS.textSecondary}
                />
              </TouchableOpacity>

              {/* Card picker dropdown */}
              {showPicker && (
                <Animated.View
                  entering={FadeInDown.duration(200)}
                  style={styles.pickerDropdown}
                >
                  {accountList.map((acc: any, idx: number) => (
                    <TouchableOpacity
                      key={acc.id}
                      style={[
                        styles.pickerItem,
                        acc.id === selectedAccount?.id && styles.pickerItemActive,
                      ]}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setAccountId(acc.id);
                        setShowPicker(false);
                      }}
                    >
                      <LinearGradient
                        colors={CARD_THEMES[idx % CARD_THEMES.length].gradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.pickerDot}
                      />
                      <View style={styles.pickerInfo}>
                        <Text style={styles.pickerBank}>{acc.bank_name}</Text>
                        <Text style={styles.pickerNum}>
                          •••• {acc.card_number_last4}
                        </Text>
                      </View>
                      <Text style={styles.pickerBalance}>
                        {fmtINR(acc.balance, true)}
                      </Text>
                      {acc.id === selectedAccount?.id && (
                        <Ionicons
                          name="checkmark-circle"
                          size={18}
                          color={COLORS.purple}
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                </Animated.View>
              )}
            </Animated.View>
          )}

          {/* ── Title ────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.duration(300).delay(120)}>
            <FormField label="Title" value={title} onChangeText={setTitle} />
          </Animated.View>

          {/* ── Categories ───────────────────────────────────── */}
          <Animated.View
            entering={FadeInDown.duration(300).delay(150)}
            style={styles.section}
          >
            <Text style={styles.sectionLabel}>Category</Text>
            <CategoryChips selected={category} onSelect={setCategory} />
          </Animated.View>

          {/* ── Merchant ─────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.duration(300).delay(180)}>
            <FormField
              label="Merchant (optional)"
              value={merchant}
              onChangeText={setMerchant}
            />
          </Animated.View>

          {/* ── Recurring ────────────────────────────────────── */}
          <Animated.View
            entering={FadeInDown.duration(300).delay(210)}
            style={styles.recurRow}
          >
            <View>
              <Text style={styles.recurLabel}>Recurring transaction</Text>
              <Text style={styles.recurSub}>Repeats every month</Text>
            </View>
            <Switch
              value={recurring}
              onValueChange={(v) => { Haptics.selectionAsync(); setRecurring(v); }}
              trackColor={{ false: COLORS.border, true: COLORS.purple }}
              thumbColor="#fff"
            />
          </Animated.View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <GradientButton
            label="Save Transaction"
            onPress={handleSave}
            loading={loading}
            style={styles.saveBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: COLORS.bg },
  content: { paddingHorizontal: 20, paddingBottom: 40 },

  // Type toggle
  typeRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  typeBtn: {
    flex: 1, height: 48, borderRadius: 24, alignItems: 'center',
    justifyContent: 'center', backgroundColor: COLORS.bgCard,
    borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden',
  },
  typeBtnActive:  { borderColor: 'transparent' },
  typeGrad:       { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', borderRadius: 24 },
  typeText:       { color: COLORS.textSecondary, fontSize: 14, fontWeight: '600' },
  typeTextActive: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // Amount
  amountWrap: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'center', marginBottom: 8,
  },
  rupeeSym:      { color: COLORS.textSecondary, fontSize: 28, marginTop: 8, fontWeight: '300' },
  amountDisplay: { color: COLORS.text, fontSize: 56, fontWeight: '800', letterSpacing: -2 },
  amountFieldWrap: { marginBottom: 4 },

  // Card selector
  section:      { marginBottom: 20 },
  sectionLabel: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '500', marginBottom: 10 },

  cardSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.bgCard,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardDot: {
    width: 36,
    height: 24,
    borderRadius: 6,
  },
  cardSelectorInfo: { flex: 1 },
  cardSelectorBank: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  cardSelectorNum:  { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },

  // Picker dropdown
  pickerDropdown: {
    backgroundColor: COLORS.bgCardAlt,
    borderRadius: 14,
    marginTop: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  pickerItemActive: { backgroundColor: `${COLORS.purple}12` },
  pickerDot:        { width: 30, height: 20, borderRadius: 5 },
  pickerInfo:       { flex: 1 },
  pickerBank:       { color: COLORS.text, fontSize: 13, fontWeight: '600' },
  pickerNum:        { color: COLORS.textSecondary, fontSize: 11, marginTop: 1 },
  pickerBalance:    { color: COLORS.textSecondary, fontSize: 12, fontWeight: '500' },

  // Recurring
  recurRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.bgCard, borderRadius: 16, padding: 16,
    marginBottom: 24, borderWidth: 1, borderColor: COLORS.border,
  },
  recurLabel: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  recurSub:   { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },

  error:   { color: COLORS.expense, fontSize: 13, marginBottom: 12, textAlign: 'center' },
  saveBtn: { marginTop: 4 },

  typeInner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
