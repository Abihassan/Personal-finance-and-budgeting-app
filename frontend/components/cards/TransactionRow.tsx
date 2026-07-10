import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCategoryById, COLORS } from '@/utils/constants';
import { fmtINR, fmtShortDate } from '@/utils/format';
import { CategoryIcon } from '@/components/common/CategoryIcon';

interface Transaction {
  id: string;
  title: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  merchant?: string;
  is_recurring: boolean;
  date: string;
}

interface Props {
  tx: Transaction;
  onLongPress?: (id: string) => void;
}

export function TransactionRow({ tx, onLongPress }: Props) {
  const cat = getCategoryById(tx.category);
  const isIncome = tx.type === 'income';

  return (
    <TouchableOpacity
      style={styles.row}
      onLongPress={() => onLongPress?.(tx.id)}
      delayLongPress={500}
      activeOpacity={0.7}
    >
      {/* Icon */}
      <View style={[styles.icon, { backgroundColor: `${cat.color}20` }]}>
        <CategoryIcon icon={cat.icon} size={24} />
      </View>

      {/* Details */}
      <View style={styles.details}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>{tx.title}</Text>
          {tx.is_recurring && (
            <View style={styles.recurBadge}>
              <Ionicons name="repeat" size={10} color={COLORS.cyan} />
            </View>
          )}
        </View>
        <Text style={styles.meta}>
          {tx.merchant || cat.label} · {fmtShortDate(tx.date)}
        </Text>
      </View>

      {/* Amount */}
      <Text style={[styles.amount, { color: isIncome ? COLORS.income : COLORS.expense }]}>
        {isIncome ? '+' : '-'}{fmtINR(tx.amount, true)}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  title: { color: COLORS.text, fontSize: 14, fontWeight: '500', flex: 1 },
  recurBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: `${COLORS.cyan}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: { color: COLORS.textSecondary, fontSize: 12 },
  amount: { fontSize: 14, fontWeight: '700' },
});
