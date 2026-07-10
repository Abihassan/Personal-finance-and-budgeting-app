import React, { useState } from 'react';
import {
  KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TouchableOpacity, View, Alert,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components/common/Header';
import { FormField } from '@/components/common/FormField';
import { GradientButton } from '@/components/common/GradientButton';
import { CategoryChips } from '@/components/common/CategoryChips';
import { CategoryIcon } from '@/components/common/CategoryIcon';
import { budgetsApi } from '@/api';
import { COLORS, QK, getCategoryById } from '@/utils/constants';
import { rupeesToPaise, fmtINR } from '@/utils/format';

export default function AddBudgetModal() {
  const router = useRouter();
  const qc = useQueryClient();

  const [category, setCategory] = useState('food');
  const [limit, setLimit] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { data, refetch } = useQuery({
    queryKey: QK.budgets,
    queryFn: () => budgetsApi.list().then(r => r.data),
  });
  const budgets: any[] = data?.budgets ?? [];

  const handleSave = async () => {
    if (!limit || isNaN(parseFloat(limit))) { setError('Enter a valid amount'); return; }
    setError('');
    setLoading(true);
    try {
      await budgetsApi.create({
        category,
        monthly_limit: rupeesToPaise(limit),
        period: 'monthly',
      });
      qc.invalidateQueries({ queryKey: QK.budgets });
      qc.invalidateQueries({ queryKey: QK.breakdown });
      setLimit('');
    } catch (e: any) {
      setError(e.response?.data?.detail ?? 'Failed to save budget');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, catLabel: string) => {
    Alert.alert('Delete Budget', `Remove the ${catLabel} budget?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await budgetsApi.delete(id);
          qc.invalidateQueries({ queryKey: QK.budgets });
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Header title="Manage Budgets" onClose={() => router.back()} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Add New Budget */}
          <Animated.View entering={FadeInDown.duration(300)} style={styles.card}>
            <Text style={styles.cardTitle}>Add New Budget</Text>

            <Text style={styles.sectionLabel}>Category</Text>
            <CategoryChips selected={category} onSelect={setCategory} />

            <View style={styles.spacer} />

            <FormField
              label="Monthly Limit (₹)"
              value={limit}
              onChangeText={setLimit}
              keyboardType="decimal-pad"
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <GradientButton label="Add Budget" onPress={handleSave} loading={loading} />
          </Animated.View>

          {/* Existing Budgets */}
          {budgets.length > 0 && (
            <Animated.View entering={FadeInDown.duration(300).delay(120)} style={styles.card}>
              <Text style={styles.cardTitle}>Your Budgets</Text>
              {budgets.map((b: any, i: number) => {
                const cat = getCategoryById(b.category);
                return (
                  <View key={b.id} style={[styles.budgetRow, i < budgets.length - 1 && styles.budgetBorder]}>
                    <View style={[styles.catIcon, { backgroundColor: `${cat.color}20` }]}>
                      <CategoryIcon icon={cat.icon} size={20} />
                    </View>
                    <View style={styles.budgetInfo}>
                      <Text style={styles.budgetCat}>{cat.label}</Text>
                      <Text style={styles.budgetLimit}>{fmtINR(b.monthly_limit, true)} / month</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDelete(b.id, cat.label)}
                      style={styles.deleteBtn}
                      hitSlop={8}
                    >
                      <Ionicons name="trash-outline" size={18} color={COLORS.expense} />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </Animated.View>
          )}

          <View style={styles.bottomPad} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  card: {
    backgroundColor: COLORS.bgCard, borderRadius: 20, padding: 20,
    marginBottom: 16, borderWidth: 1, borderColor: COLORS.border,
  },
  cardTitle: { color: COLORS.text, fontSize: 16, fontWeight: '700', marginBottom: 16 },
  sectionLabel: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '500', marginBottom: 10 },
  spacer: { height: 16 },
  error: { color: COLORS.expense, fontSize: 13, marginBottom: 12, textAlign: 'center' },
  budgetRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  budgetBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  catIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  budgetInfo: { flex: 1 },
  budgetCat: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  budgetLimit: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  deleteBtn: { padding: 4 },
  bottomPad: { height: 20 },
});
