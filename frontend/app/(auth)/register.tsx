import React, { useState } from 'react';
import {
  KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AuthService } from '@/auth/auth.service';
import { useAuthStore } from '@/store/auth.store';
import { FormField } from '@/components/common/FormField';
import { GradientButton } from '@/components/common/GradientButton';
import { COLORS } from '@/utils/constants';

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
}

export default function RegisterScreen() {
  const router = useRouter();
  const { loading, error, setError } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const validate = (): boolean => {
    const errs: FieldErrors = {};
    if (!name.trim()) errs.name = 'Name is required';
    if (!email.includes('@')) errs.email = 'Enter a valid email';
    if (password.length < 8) errs.password = 'Password must be 8+ characters';
    if (password !== confirm) errs.confirm = 'Passwords do not match';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async () => {
    setError(null);
    if (!validate()) return;
    try {
      await AuthService.register(name.trim(), email.trim(), password);
    } catch { /* error set in store */ }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.heading}>Create account</Text>
          <Text style={styles.sub}>Start tracking your finances today</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.form}>
          {error && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={16} color={COLORS.expense} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <FormField label="Full Name" value={name} onChangeText={setName} error={fieldErrors.name} autoCapitalize="words" />
          <FormField label="Email" value={email} onChangeText={setEmail} error={fieldErrors.email} keyboardType="email-address" autoCapitalize="none" />
          <FormField
            label="Password"
            value={password}
            onChangeText={setPassword}
            error={fieldErrors.password}
            secureTextEntry={!showPass}
            rightIcon={<Ionicons name={showPass ? 'eye-off' : 'eye'} size={20} color={COLORS.textSecondary} />}
            onRightIconPress={() => setShowPass(p => !p)}
          />
          <FormField
            label="Confirm Password"
            value={confirm}
            onChangeText={setConfirm}
            error={fieldErrors.confirm}
            secureTextEntry={!showPass}
          />

          <GradientButton label="Create Account" onPress={handleRegister} loading={loading} style={styles.btn} />

          <TouchableOpacity onPress={() => router.replace('/(auth)/login')} style={styles.link}>
            <Text style={styles.linkText}>Already have an account? <Text style={styles.accent}>Sign in</Text></Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  header: { marginBottom: 32 },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.bgCard, alignItems: 'center',
    justifyContent: 'center', marginBottom: 20,
  },
  heading: { color: COLORS.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.5, marginBottom: 6 },
  sub: { color: COLORS.textSecondary, fontSize: 15 },
  form: { backgroundColor: COLORS.bgCard, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: COLORS.border },
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(244,114,182,0.12)', borderRadius: 12,
    padding: 12, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(244,114,182,0.3)',
  },
  errorText: { color: COLORS.expense, fontSize: 13, flex: 1 },
  btn: { marginTop: 8 },
  link: { marginTop: 16, alignItems: 'center' },
  linkText: { color: COLORS.textSecondary, fontSize: 14 },
  accent: { color: COLORS.cyan, fontWeight: '600' },
});
