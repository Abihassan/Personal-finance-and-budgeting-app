import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { fmtINR } from '@/utils/format';

const { width } = Dimensions.get('window');
export const CARD_W = width - 48;
export const CARD_H = CARD_W * 0.56;

// Each card has its own gradient theme — matches the image's soft pastel look
export const CARD_THEMES: {
  gradient: [string, string, string];
  chip: string;
  textPrimary: string;
  textSecondary: string;
  highlight: string;
}[] = [
  {
    // Purple → Blue (matches reference image)
    gradient: ['#C8B6FF', '#A0C4FF', '#BDE0FE'],
    chip: 'rgba(255,255,255,0.6)',
    textPrimary: '#1A1A3E',
    textSecondary: '#3A3A6E',
    highlight: 'rgba(255,255,255,0.45)',
  },
  {
    // Teal → Cyan
    gradient: ['#A8EDEA', '#81C784', '#A0C4FF'],
    chip: 'rgba(255,255,255,0.5)',
    textPrimary: '#0A2E2B',
    textSecondary: '#1A4A45',
    highlight: 'rgba(255,255,255,0.4)',
  },
  {
    // Pink → Purple
    gradient: ['#FFAFCC', '#CDB4DB', '#A2D2FF'],
    chip: 'rgba(255,255,255,0.55)',
    textPrimary: '#2D0030',
    textSecondary: '#5A0060',
    highlight: 'rgba(255,255,255,0.4)',
  },
  {
    // Gold → Orange
    gradient: ['#FFD6A5', '#FFAFCC', '#CAFFBF'],
    chip: 'rgba(255,255,255,0.5)',
    textPrimary: '#2B1A00',
    textSecondary: '#4A3000',
    highlight: 'rgba(255,255,255,0.45)',
  },
  {
    // Dark navy — premium card
    gradient: ['#2D3561', '#553C9A', '#7B5EA7'],
    chip: 'rgba(255,255,255,0.3)',
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.75)',
    highlight: 'rgba(255,255,255,0.12)',
  },
];

interface Props {
  bankName: string;
  last4: string;
  balance: number;    // paise
  expiry: string;
  isAsset: boolean;
  themeIndex?: number;
  isPreview?: boolean;
  cardType?: string;   // 'Debit' | 'Credit' | 'Prepaid'
}

export function BankCard({
  bankName,
  last4,
  balance,
  expiry,
  isAsset,
  themeIndex = 0,
  isPreview,
  cardType = 'Debit',
}: Props) {
  const theme = CARD_THEMES[themeIndex % CARD_THEMES.length];
  const mountAnim = useSharedValue(0);

  useEffect(() => {
    mountAnim.value = withTiming(1, { duration: 600 });
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: mountAnim.value,
    transform: [
      { translateY: interpolate(mountAnim.value, [0, 1], [10, 0]) },
    ],
  }));

  const cardW = isPreview ? '100%' : CARD_W;
  const cardH = isPreview ? 186 : CARD_H;

  return (
    <Animated.View style={[{ alignItems: 'center' }, animStyle]}>
      <LinearGradient
        colors={theme.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.card,
          { width: cardW as any, height: cardH },
        ]}
      >
        {/* Glass highlight overlay — top-left catch */}
        <View style={[styles.highlight, { backgroundColor: theme.highlight }]} />

        {/* Top row: bank name + card type */}
        <View style={styles.topRow}>
          <Text style={[styles.bankName, { color: theme.textPrimary }]}>
            {bankName || 'Bank Name'}
          </Text>
          <Text style={[styles.cardType, { color: theme.textSecondary }]}>
            {cardType}
          </Text>
        </View>

        {/* Balance */}
        <Text style={[styles.balance, { color: theme.textPrimary }]}>
          {fmtINR(balance)}
        </Text>

        {/* Middle row: chip icon + masked number */}
        <View style={styles.middleRow}>
          {/* EMV Chip */}
          <View style={[styles.chip, { backgroundColor: theme.chip }]}>
            <View style={styles.chipInner} />
          </View>
          <Text style={[styles.cardNum, { color: theme.textSecondary }]}>
            ••• {last4 || '0000'}  ••••••  {last4 || '0000'}
          </Text>
        </View>

        {/* Bottom row: expiry + network + contactless */}
        <View style={styles.bottomRow}>
          <View>
            <Text style={[styles.expiryLabel, { color: theme.textSecondary }]}>Exp:</Text>
            <Text style={[styles.expiry, { color: theme.textPrimary }]}>
              {expiry || 'MM/YY'}
            </Text>
          </View>

          <View style={styles.bottomRight}>
            {/* VISA wordmark — italic bold text (no trademarked asset) */}
            <Text style={[styles.visaText, { color: theme.textPrimary }]}>VISA</Text>
            {/* Contactless icon */}
            <Ionicons
              name="wifi-outline"
              size={20}
              color={theme.textSecondary}
              style={styles.contactless}
            />
          </View>
        </View>

        {/* Asset / Liability badge */}
        <View style={[
          styles.badge,
          { backgroundColor: isAsset ? 'rgba(16,217,160,0.2)' : 'rgba(244,114,182,0.2)' },
        ]}>
          <Text style={[
            styles.badgeText,
            { color: isAsset ? '#059669' : '#DB2777' },
          ]}>
            {isAsset ? 'Asset' : 'Liability'}
          </Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    padding: 22,
    justifyContent: 'space-between',
    overflow: 'hidden',
    // Soft shadow like the reference image
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 10,
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: '40%',
    height: '50%',
    borderBottomRightRadius: 80,
    borderTopLeftRadius: 22,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bankName: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  cardType: {
    fontSize: 13,
    fontWeight: '500',
  },
  balance: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  middleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  // EMV chip
  chip: {
    width: 34,
    height: 26,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  chipInner: {
    width: 20,
    height: 14,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  cardNum: {
    fontSize: 13,
    letterSpacing: 1.5,
    fontWeight: '500',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  expiryLabel: {
    fontSize: 9,
    fontWeight: '500',
    letterSpacing: 0.5,
    marginBottom: 1,
  },
  expiry: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  bottomRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  visaText: {
    fontSize: 20,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: -0.5,
  },
  contactless: {
    transform: [{ rotate: '90deg' }],
  },
  badge: {
    position: 'absolute',
    top: 14,
    right: 14,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
