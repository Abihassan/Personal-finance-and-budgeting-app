import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { CATEGORIES, COLORS } from '@/utils/constants';
import { CategoryIcon } from './CategoryIcon';

interface Props {
  selected: string;
  onSelect: (id: string) => void;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

function Chip({ item, isSelected, onPress }: {
  item: typeof CATEGORIES[number];
  isSelected: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedTouchable
      style={[styles.chip, isSelected && { borderColor: item.color, backgroundColor: `${item.color}20` }, animStyle]}
      onPress={() => {
        Haptics.selectionAsync();
        scale.value = withSpring(0.92, {}, () => { scale.value = withSpring(1); });
        onPress();
      }}
      activeOpacity={1}
    >
      <CategoryIcon icon={item.icon} size={16} color={isSelected ? item.color : COLORS.textSecondary} />
      <Text style={[styles.label, isSelected && { color: item.color }]}>{item.label}</Text>
    </AnimatedTouchable>
  );
}

export function CategoryChips({ selected, onSelect }: Props) {
  return (
    <FlatList
      data={CATEGORIES}
      keyExtractor={(i) => i.id}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <Chip
          item={item}
          isSelected={selected === item.id}
          onPress={() => onSelect(item.id)}
        />
      )}
    />
  );
}

// Grid variant for add-investment type selector
export function CategoryGrid({ selected, onSelect }: Props) {
  return (
    <View style={styles.grid}>
      {CATEGORIES.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={[styles.gridChip, selected === item.id && { borderColor: item.color, backgroundColor: `${item.color}20` }]}
          onPress={() => { Haptics.selectionAsync(); onSelect(item.id); }}
        >
          <CategoryIcon icon={item.icon} size={22} color={selected === item.id ? item.color : COLORS.textSecondary} />
          <Text style={[styles.gridLabel, selected === item.id && { color: item.color }]}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 4, gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgCard,
  },
  label: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '500' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridChip: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    width: '30%',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgCard,
  },
  gridLabel: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '500' },
});
