import React, { useState } from 'react';
import {
  KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AuthService } from '@/auth/auth.service';
import { useAuthStore } from '@/store/auth.store';
import { FormField } from '@/components/common/FormField';
import { GradientButton } from '@/components/common/GradientButton';
import { CategoryIcon } from '@/components/common/CategoryIcon';
import { COLORS, GRADIENTS, ICONS } from '@/utils/constants';
import { apiClient } from '@/api/client';

export default function LoginScreen() {
  const router = useRouter();
  const { loading, error, setError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [pingStatus, setPingStatus] = useState<{ ok: boolean; message: string } | null>(null);

  const handleLogin = async () => {
    if (!email || !password) { setError('Please fill all fields.'); return; }
    try {
      await AuthService.login(email, password);
    } catch { /* error set in store */ }
  };

  const handlePing = async () => {
    try {
      await apiClient.get('/health');
      setPingStatus({ ok: true, message: 'Backend reachable' });
    } catch {
      setPingStatus({ ok: false, message: 'Cannot reach backend' });
    }
    setTimeout(() => setPingStatus(null), 3000);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Logo */}
        <Animated.View entering={FadeInDown.duration(500)} style={styles.logoWrap}>
          <LinearGradient colors={GRADIENTS.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.logoCircle}>
            <Text style={styles.logoText}>S</Text>
          </LinearGradient>
          <Text style={styles.appName}>Sequro</Text>
          <Text style={styles.tagline}>Your personal finance advisor</Text>
        </Animated.View>

        {/* Form */}
        <Animated.View entering={FadeInDown.duration(500).delay(120)} style={styles.form}>
          <Text style={styles.heading}>Welcome back</Text>
          <Text style={styles.sub}>Sign in to continue</Text>

          {error && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={16} color={COLORS.expense} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <FormField
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <FormField
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPass}
            rightIcon={
              <Ionicons name={showPass ? 'eye-off' : 'eye'} size={20} color={COLORS.textSecondary} />
            }
            onRightIconPress={() => setShowPass(p => !p)}
          />

          <GradientButton label="Sign In" onPress={handleLogin} loading={loading} style={styles.btn} />

          <TouchableOpacity onPress={() => router.push('/(auth)/register')} style={styles.link}>
            <Text style={styles.linkText}>Don't have an account? <Text style={styles.linkAccent}>Create one</Text></Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Debug ping */}
        <Animated.View entering={FadeInDown.duration(500).delay(240)} style={styles.debug}>
          <TouchableOpacity onPress={handlePing} style={styles.pingBtn}>
            <Ionicons name="pulse" size={14} color={COLORS.textMuted} />
            <Text style={styles.pingText}>Test backend connection</Text>
          </TouchableOpacity>
          {pingStatus && (
            <View style={styles.pingStatusRow}>
              <CategoryIcon icon={pingStatus.ok ? ICONS.statusSuccess : ICONS.statusFail} size={16} />
              <Text style={styles.pingStatus}>{pingStatus.message}</Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { paddingHorizontal: 24, paddingTop: 80, paddingBottom: 40 },
  logoWrap: { alignItems: 'center', marginBottom: 48 },
  logoCircle: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  logoText: { color: '#fff', fontSize: 36, fontWeight: '800' },
  appName: { color: COLORS.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  tagline: { color: COLORS.textSecondary, fontSize: 14, marginTop: 4 },
  form: { backgroundColor: COLORS.bgCard, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: COLORS.border },
  heading: { color: COLORS.text, fontSize: 22, fontWeight: '700', marginBottom: 4 },
  sub: { color: COLORS.textSecondary, fontSize: 14, marginBottom: 24 },
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(244,114,182,0.12)', borderRadius: 12,
    padding: 12, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(244,114,182,0.3)',
  },
  errorText: { color: COLORS.expense, fontSize: 13, flex: 1 },
  btn: { marginTop: 8 },
  link: { marginTop: 16, alignItems: 'center' },
  linkText: { color: COLORS.textSecondary, fontSize: 14 },
  linkAccent: { color: COLORS.cyan, fontWeight: '600' },
  debug: { marginTop: 32, alignItems: 'center' },
  pingBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pingText: { color: COLORS.textMuted, fontSize: 12 },
  pingStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  pingStatus: { color: COLORS.textSecondary, fontSize: 12 },
});
