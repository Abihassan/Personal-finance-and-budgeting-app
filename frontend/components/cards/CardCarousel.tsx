/**
 * CardCarousel — stacked swipeable card carousel
 *
 * Visual behaviour (exactly like the reference image):
 *  - Active card: full size, front, full opacity
 *  - Card behind (index+1): peeking below/behind, scaled down slightly, offset down
 *  - Card behind that (index+2): even smaller peek
 *  - Swipe left  → next card becomes active
 *  - Swipe right → previous card becomes active
 *  - Tap any peeking card → jump to it
 *  - Dot indicators at the bottom
 */
import React, { useCallback, useState } from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { BankCard, CARD_H, CARD_W, CARD_THEMES } from './BankCard';
import { COLORS } from '@/utils/constants';
import { fmtINR } from '@/utils/format';

const { width: SCREEN_W } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_W * 0.28;

// How much each card behind the active one peeks out at the bottom
const PEEK_OFFSET = 10;   // px shifted down per stack position
const PEEK_SCALE  = 0.04; // scale reduction per stack position

export interface CardData {
  id: string;
  bank_name: string;
  card_number_last4: string;
  balance: number;   // paise
  expiry: string;
  is_asset: boolean;
  card_type?: string;
}

interface Props {
  cards: CardData[];
  activeIndex: number;
  onActiveChange: (index: number) => void;
  onAddCard: () => void;
}

function StackedCard({
  card,
  stackPos,       // 0 = active, 1 = first behind, 2 = second behind
  themeIndex,
  onTap,
}: {
  card: CardData;
  stackPos: number;
  themeIndex: number;
  onTap: () => void;
}) {
  const isActive = stackPos === 0;
  const scale    = 1 - stackPos * PEEK_SCALE;
  const offsetY  = stackPos * PEEK_OFFSET;
  const opacity  = stackPos > 2 ? 0 : 1 - stackPos * 0.15;

  const style = {
    transform: [{ scale }, { translateY: offsetY }],
    opacity,
    zIndex: 10 - stackPos,
  };

  if (stackPos > 2) return null;

  return (
    <TouchableOpacity
      activeOpacity={isActive ? 1 : 0.85}
      onPress={isActive ? undefined : onTap}
      style={[StyleSheet.absoluteFill, { alignItems: 'center' }]}
    >
      <Animated.View style={style}>
        <BankCard
          bankName={card.bank_name}
          last4={card.card_number_last4}
          balance={card.balance}
          expiry={card.expiry}
          isAsset={card.is_asset}
          themeIndex={themeIndex}
          cardType={card.card_type ?? (card.is_asset ? 'Debit' : 'Credit')}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

export function CardCarousel({ cards, activeIndex, onActiveChange, onAddCard }: Props) {
  const translateX = useSharedValue(0);
  const [localIndex, setLocalIndex] = useState(activeIndex);

  const goTo = useCallback((idx: number) => {
    const clamped = Math.max(0, Math.min(cards.length - 1, idx));
    setLocalIndex(clamped);
    onActiveChange(clamped);
  }, [cards.length, onActiveChange]);

  // Swipe gesture
  const pan = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
    })
    .onEnd((e) => {
      if (e.translationX < -SWIPE_THRESHOLD) {
        runOnJS(goTo)(localIndex + 1);
      } else if (e.translationX > SWIPE_THRESHOLD) {
        runOnJS(goTo)(localIndex - 1);
      }
      translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
    });

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value * 0.15 }], // subtle parallax drag
  }));

  if (cards.length === 0) {
    return (
      <TouchableOpacity style={styles.emptyCard} onPress={onAddCard} activeOpacity={0.8}>
        <View style={styles.emptyInner}>
          <Ionicons name="add-circle-outline" size={32} color={COLORS.purple} />
          <Text style={styles.emptyText}>Add your first card</Text>
          <Text style={styles.emptySub}>Tap to get started</Text>
        </View>
      </TouchableOpacity>
    );
  }

  // Build the stack: active card on top, up to 2 peeking behind it
  const stackCards = [];
  for (let offset = Math.min(2, cards.length - 1 - localIndex); offset >= 0; offset--) {
    stackCards.push({ card: cards[localIndex + offset], stackPos: offset, themeIndex: (localIndex + offset) % CARD_THEMES.length });
  }

  return (
    <View style={styles.wrapper}>
      {/* Card stack container — height accounts for peek offsets */}
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.stackContainer, animStyle]}>
          {stackCards.map(({ card, stackPos, themeIndex }) => (
            <StackedCard
              key={card.id}
              card={card}
              stackPos={stackPos}
              themeIndex={themeIndex}
              onTap={() => goTo(localIndex + stackPos)}
            />
          ))}
        </Animated.View>
      </GestureDetector>

      {/* Card info strip below the stack */}
      <View style={styles.infoStrip}>
        <View>
          <Text style={styles.infoBank}>{cards[localIndex].bank_name}</Text>
          <Text style={styles.infoBalance}>
            {fmtINR(cards[localIndex].balance)}
          </Text>
        </View>

        {/* Add card button */}
        <TouchableOpacity style={styles.addBtn} onPress={onAddCard} activeOpacity={0.8}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.addBtnText}>Add card</Text>
        </TouchableOpacity>
      </View>

      {/* Dot indicators */}
      <View style={styles.dots}>
        {cards.map((_, i) => (
          <TouchableOpacity key={i} onPress={() => goTo(i)}>
            <View style={[
              styles.dot,
              i === localIndex && styles.dotActive,
            ]} />
          </TouchableOpacity>
        ))}
        {/* "+" placeholder dot if user has fewer than 5 cards */}
        {cards.length < 5 && (
          <TouchableOpacity onPress={onAddCard}>
            <View style={[styles.dot, styles.dotAdd]}>
              <Ionicons name="add" size={8} color={COLORS.textMuted} />
            </View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 8,
  },
  // Stack container height = card height + peek offsets for 2 behind cards
  stackContainer: {
    height: CARD_H + PEEK_OFFSET * 2 + 8,
    width: '100%',
    alignItems: 'center',
  },
  infoStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingHorizontal: 4,
  },
  infoBank: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  infoBalance: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.purple,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: COLORS.border,
  },
  dotActive: {
    width: 22,
    backgroundColor: COLORS.purple,
    borderRadius: 3.5,
  },
  dotAdd: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    height: CARD_H + PEEK_OFFSET * 2 + 8 + 14 + 32 + 14,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyInner: {
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  emptySub: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
});
