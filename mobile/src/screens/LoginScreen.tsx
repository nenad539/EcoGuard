import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { BlurView } from 'expo-blur';
import { Leaf, Shield, Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { supabase } from '../lib/supabase';
import { colors, radius, spacing, gradients } from '../styles/common';
import { GradientBackground } from '../components/common/GradientBackground';
import { LinearGradient } from 'expo-linear-gradient';
import { showError, showSuccess } from '../lib/toast';
import { ScreenFade } from '../components/common/ScreenFade';
import { trackEvent } from '../lib/analytics';
import { triggerHaptic } from '../lib/haptics';
import { useLanguage } from '../lib/language';

export function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const handleLogin = async () => {
    void triggerHaptic('selection');
    trackEvent('login_attempt');
    if (!email || !password) {
      showError("Gre\u0161ka", "Unesite email i lozinku");
      trackEvent('login_error', { reason: 'missing_fields' });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      showError("Gre\u0161ka", error.message);
      trackEvent('login_error', { status: error.status ?? null });
      return;
    }

    showSuccess("Uspjeh", "Prijava uspje\u0161na.");
    void triggerHaptic('success');
    trackEvent('login_success');
    navigation.replace('MainTabs');
  };

  const handleReset = async () => {
    void triggerHaptic('selection');
    trackEvent('password_reset_request');
    if (!resetEmail) {
      showError("Gre\u0161ka", "Unesite email adresu");
      trackEvent('password_reset_error', { reason: 'missing_email' });
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail);
    if (error) {
      showError("Gre\u0161ka", error.message);
      trackEvent('password_reset_error', { status: error.status ?? null });
      return;
    }

    showSuccess("Poslato", "Provjerite email za reset lozinke.");
    void triggerHaptic('success');
    trackEvent('password_reset_sent');
    setForgot(false);
    setResetEmail('');
  };

  return (
    <GradientBackground>
      <ScreenFade>
        <View style={styles.container}>
        <View style={styles.header}>
            <View style={styles.logoRow}>
              <View style={styles.logoCircle}>
                <Shield size={40} color={colors.primary} strokeWidth={1.5} />
                <Leaf size={20} color={colors.primaryDark} style={styles.logoLeaf} />
              </View>
            <Text style={styles.logoText}>{"GrowWithUs"}</Text>
          </View>
        </View>

        {!forgot ? (
          <BlurView intensity={30} tint="dark" style={styles.form}>
            <Text style={styles.formTitle}>{"Dobrodo\u0161li nazad"}</Text>

            <View style={styles.field}>
              <Text style={styles.label}>{"Email"}</Text>
              <View style={styles.inputWrapper}>
                <Mail color={colors.muted} size={18} style={styles.inputIcon} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="youremail@example.com"
                  placeholderTextColor={colors.muted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{"Lozinka"}</Text>
              <View style={styles.inputWrapper}>
                <Lock color={colors.muted} size={18} style={styles.inputIcon} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={colors.muted}
                  secureTextEntry={!showPassword}
                  style={styles.input}
                />
                <TouchableOpacity
                  onPress={() => {
                    void triggerHaptic('selection');
                    setShowPassword((prev) => !prev);
                  }}
                  style={styles.toggleButton}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Sakrij lozinku' : 'Prikaži lozinku'}
                >
                  {showPassword ? (
                    <EyeOff color={colors.muted} size={18} />
                  ) : (
                    <Eye color={colors.muted} size={18} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => {
                void triggerHaptic('selection');
                setForgot(true);
              }}
              accessibilityRole="button"
              accessibilityLabel={"Zaboravljena lozinka?"}
            >
              <Text style={styles.link}>{"Zaboravljena lozinka?"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled={loading}
              onPress={handleLogin}
              style={styles.submitWrap}
              accessibilityRole="button"
              accessibilityLabel={"Prijavi se"}
              accessibilityState={{ disabled: loading }}
            >
              <LinearGradient colors={gradients.primary} style={styles.submitButton}>
                <Text style={styles.submitText}>
                  {loading ? "U\u010ditavanje..." : "Prijavi se"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                void triggerHaptic('selection');
                navigation.navigate('Register');
              }}
              accessibilityRole="button"
              accessibilityLabel={"Registruj se"}
            >
              <Text style={styles.linkMuted}>{"Nemate nalog? Registrujte se"}</Text>
            </TouchableOpacity>
          </BlurView>
        ) : (
          <BlurView intensity={30} tint="dark" style={styles.form}>
            <Text style={styles.formTitle}>{"Reset lozinke"}</Text>
            <Text style={styles.formSubtitle}>
              {"Unesite email adresu i posla\u0107emo vam link za reset."}
            </Text>
            <View style={styles.field}>
              <Text style={styles.label}>{"Email"}</Text>
              <View style={styles.inputWrapper}>
                <Mail color={colors.muted} size={18} style={styles.inputIcon} />
                <TextInput
                  value={resetEmail}
                  onChangeText={setResetEmail}
                  placeholder="youremail@example.com"
                  placeholderTextColor={colors.muted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                />
              </View>
            </View>
            <TouchableOpacity
              onPress={handleReset}
              style={styles.submitWrap}
              accessibilityRole="button"
              accessibilityLabel={"Po\u0161alji link"}
            >
              <LinearGradient colors={gradients.primary} style={styles.submitButton}>
                <Text style={styles.submitText}>{"Po\u0161alji link"}</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                void triggerHaptic('selection');
                setForgot(false);
              }}
              accessibilityRole="button"
              accessibilityLabel={"Nazad na prijavu"}
            >
              <Text style={styles.linkMuted}>{"Nazad na prijavu"}</Text>
            </TouchableOpacity>
          </BlurView>
        )}
        </View>
      </ScreenFade>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  logoLeaf: {
    position: 'absolute',
  },
  logoText: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '600',
  },
  form: {
    padding: spacing.lg,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  formSubtitle: {
    color: colors.muted,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  field: {
    marginBottom: spacing.md,
  },
  label: {
    color: colors.softGreen,
    marginBottom: spacing.xs,
    fontWeight: '500',
  },
  inputWrapper: {
    position: 'relative',
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#4b5563',
    justifyContent: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: 12,
  },
  toggleButton: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
  input: {
    color: colors.text,
    paddingVertical: 12,
    paddingHorizontal: 44,
    paddingRight: 44,
  },
  link: {
    color: colors.primary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  submitWrap: {
    marginBottom: spacing.md,
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  submitText: {
    color: colors.text,
    fontWeight: '600',
  },
  linkMuted: {
    color: colors.muted,
    marginTop: spacing.md,
    textAlign: 'center',
  },
});
