import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { COLORS, GRADIENTS } from '@/utils/constants';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const TABS: { name: string; label: string; icon: IconName; iconActive: IconName }[] = [
  { name: 'index',     label: 'Home',      icon: 'home-outline',          iconActive: 'home' },
  { name: 'spend',     label: 'Spend',     icon: 'wallet-outline',        iconActive: 'wallet' },
  { name: 'invest',    label: 'Invest',    icon: 'trending-up-outline',   iconActive: 'trending-up' },
  { name: 'portfolio', label: 'Portfolio', icon: 'pie-chart-outline',     iconActive: 'pie-chart' },
  { name: 'more',      label: 'More',      icon: 'grid-outline',          iconActive: 'grid' },
];

function TabBarButton({
  isFocused, onPress, onLongPress, icon, iconActive, label,
}: {
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  icon: IconName;
  iconActive: IconName;
  label: string;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <TouchableOpacity
      style={styles.tabBtn}
      onPress={() => {
        scale.value = withSpring(0.85, {}, () => { scale.value = withSpring(1); });
        onPress();
      }}
      onLongPress={onLongPress}
      activeOpacity={1}
    >
      <Animated.View style={[styles.tabInner, animStyle]}>
        {isFocused ? (
          <LinearGradient
            colors={GRADIENTS.brand}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.activePill}
          >
            <Ionicons name={iconActive} size={20} color="#fff" />
            <Text style={styles.activeLabel}>{label}</Text>
          </LinearGradient>
        ) : (
          <>
            <Ionicons name={icon} size={22} color={COLORS.textMuted} />
            <Text style={styles.inactiveLabel}>{label}</Text>
          </>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

function TabBar({ state, descriptors, navigation }: any) {
  return (
    <View style={styles.barWrapper}>
      <BlurView intensity={40} tint="dark" style={styles.blur}>
        <View style={styles.bar}>
          {state.routes.map((route: any, index: number) => {
            const tab = TABS.find(t => t.name === route.name) ?? TABS[0];
            const isFocused = state.index === index;
            return (
              <TabBarButton
                key={route.key}
                isFocused={isFocused}
                icon={tab.icon}
                iconActive={tab.iconActive}
                label={tab.label}
                onPress={() => {
                  const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                  if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
                }}
                onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
              />
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      {TABS.map(tab => (
        <Tabs.Screen key={tab.name} name={tab.name} />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  barWrapper: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 20,
  },
  blur: { borderRadius: 28 },
  bar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(18,18,42,0.85)',
    borderRadius: 28,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
  },
  tabBtn: { flex: 1, alignItems: 'center' },
  tabInner: { alignItems: 'center', justifyContent: 'center', minWidth: 44 },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  activeLabel: { color: '#fff', fontSize: 12, fontWeight: '700' },
  inactiveLabel: { color: COLORS.textMuted, fontSize: 10, marginTop: 2 },
});
