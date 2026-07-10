import React, { useState } from 'react';
import {
  KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Switch, Text, TouchableOpacity, View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Header } from '@/components/common/Header';
import { FormField } from '@/components/common/FormField';
import { GradientButton } from '@/components/common/GradientButton';
import { BankCard } from '@/components/cards/BankCard';
import { accountsApi } from '@/api';
import { CategoryIcon } from '@/components/common/CategoryIcon';
import { COLORS, QK, ICONS } from '@/utils/constants';
import { rupeesToPaise, fmtCardNumber } from '@/utils/format';

export default function AddAccountModal() {
  const router = useRouter();
  const qc = useQueryClient();

  const [bankName, setBankName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [balance, setBalance] = useState('');
  const [expiry, setExpiry] = useState('');
  const [isAsset, setIsAsset] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Extract last 4 from formatted card number
  const last4 = cardNumber.replace(/\s/g, '').slice(-4);

  const handleCardNumberChange = (text: string) => {
    setCardNumber(fmtCardNumber(text));
  };

  const handleExpiryChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) {
      setExpiry(`${digits.slice(0, 2)}/${digits.slice(2)}`);
    } else {
      setExpiry(digits);
    }
  };

  const handleSave = async () => {
    if (!bankName.trim()) { setError('Bank name is required'); return; }
    if (cardNumber.replace(/\s/g, '').length < 4) { setError('Enter at least 4 card digits'); return; }
    if (!balance || isNaN(parseFloat(balance))) { setError('Enter a valid balance'); return; }
    if (!expiry.includes('/')) { setError('Enter expiry as MM/YY'); return; }
    setError('');
    setLoading(true);
    try {
      await accountsApi.create({
        bank_name: bankName.trim(),
        card_number_last4: last4,
        balance: rupeesToPaise(balance),
        expiry,
        is_asset: isAsset,
      });
      qc.invalidateQueries({ queryKey: QK.accounts });
      router.back();
    } catch (e: any) {
      setError(e.response?.data?.detail ?? 'Failed to save account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Header title="Add Account" onClose={() => router.back()} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Live Card Preview */}
          <Animated.View entering={FadeInDown.duration(300)} style={styles.previewWrap}>
            <Text style={styles.sectionLabel}>Card Preview</Text>
            <BankCard
              bankName={bankName || 'Bank Name'}
              last4={last4 || '0000'}
              balance={rupeesToPaise(balance || '0')}
              expiry={expiry || 'MM/YY'}
              isAsset={isAsset}
              isPreview
            />
          </Animated.View>

          {/* Asset / Liability toggle */}
          <Animated.View entering={FadeInDown.duration(300).delay(80)} style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, isAsset && styles.toggleBtnActiveGreen]}
              onPress={() => { Haptics.selectionAsync(); setIsAsset(true); }}
            >
              <View style={styles.toggleInner}>
                <CategoryIcon icon={ICONS.toggleAsset} size={18} />
                <Text style={[styles.toggleText, isAsset && styles.toggleTextActiveGreen]}>Asset</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, !isAsset && styles.toggleBtnActivePink]}
              onPress={() => { Haptics.selectionAsync(); setIsAsset(false); }}
            >
              <View style={styles.toggleInner}>
                <CategoryIcon icon={ICONS.toggleLiability} size={18} />
                <Text style={[styles.toggleText, !isAsset && styles.toggleTextActivePink]}>Liability</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(300).delay(120)}>
            <FormField label="Bank Name" value={bankName} onChangeText={setBankName} autoCapitalize="words" />
            <FormField
              label="Card Number"
              value={cardNumber}
              onChangeText={handleCardNumberChange}
              keyboardType="numeric"
              maxLength={19}
            />
            <FormField
              label="Balance (₹)"
              value={balance}
              onChangeText={setBalance}
              keyboardType="decimal-pad"
            />
            <FormField
              label="Expiry (MM/YY)"
              value={expiry}
              onChangeText={handleExpiryChange}
              keyboardType="numeric"
              maxLength={5}
            />
          </Animated.View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <GradientButton label="Save Account" onPress={handleSave} loading={loading} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  previewWrap: { marginBottom: 20 },
  sectionLabel: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '500', marginBottom: 12 },
  toggleRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  toggleBtn: {
    flex: 1, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border,
  },
  toggleBtnActiveGreen: { borderColor: COLORS.income, backgroundColor: 'rgba(16,217,160,0.1)' },
  toggleBtnActivePink: { borderColor: COLORS.expense, backgroundColor: 'rgba(244,114,182,0.1)' },
  toggleInner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  toggleText: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '600' },
  toggleTextActiveGreen: { color: COLORS.income },
  toggleTextActivePink: { color: COLORS.expense },
  error: { color: COLORS.expense, fontSize: 13, marginBottom: 12, textAlign: 'center' },
});
