import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, TextInput } from 'react-native';
import { BlurView } from 'expo-blur';
import { Leaf, Shield, Mail, Lock, User } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { supabase } from '../lib/supabase';
import { colors, radius, spacing, gradients } from '../styles/common';
import { GradientBackground } from '../components/common/GradientBackground';
import { LinearGradient } from 'expo-linear-gradient';
import { showError, showSuccess } from '../lib/toast';

export function RegisterScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password) {
      showError('Greška', 'Popunite email i lozinku');
      return;
    }
    if (password !== confirmPassword) {
      showError('Greška', 'Lozinke se ne poklapaju');
      return;
    }
    if (!termsAccepted) {
      showError('Greška', 'Morate prihvatiti uslove korišćenja');
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    if (error) {
      setLoading(false);
      showError('Greška', error.message);
      return;
    }

    const userId = data?.user?.id;
    if (userId) {
      await supabase.from('korisnik_profil').update({ korisnicko_ime: name }).eq('id', userId);
    }

    setLoading(false);
    showSuccess('Uspešno', 'Proverite email za potvrdu naloga.');
    navigation.replace('Login');
  };

  return (
    <GradientBackground>
      <View style={styles.container}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>Nazad</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.logoRow}>
            <View style={styles.logoCircle}>
              <Shield size={38} color={colors.primary} strokeWidth={1.5} />
              <Leaf size={18} color={colors.primaryDark} style={styles.logoLeaf} />
            </View>
            <Text style={styles.logoText}>GrowWithUs</Text>
          </View>
        </View>

        <BlurView intensity={30} tint="dark" style={styles.form}>
          <Text style={styles.formTitle}>Kreiraj nalog</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Ime</Text>
            <View style={styles.inputWrapper}>
              <User color={colors.muted} size={18} style={styles.inputIcon} />
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Vaše ime"
                placeholderTextColor={colors.muted}
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
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
            <Text style={styles.label}>Lozinka</Text>
            <View style={styles.inputWrapper}>
              <Lock color={colors.muted} size={18} style={styles.inputIcon} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.muted}
                secureTextEntry
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Potvrda lozinke</Text>
            <View style={styles.inputWrapper}>
              <Lock color={colors.muted} size={18} style={styles.inputIcon} />
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.muted}
                secureTextEntry
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.termsRow}>
            <Switch value={termsAccepted} onValueChange={setTermsAccepted} />
            <Text style={styles.termsText}>Prihvatam uslove korišćenja</Text>
          </View>

          <TouchableOpacity disabled={loading} onPress={handleRegister} style={styles.submitWrap}>
            <LinearGradient colors={gradients.primary} style={styles.submitButton}>
              <Text style={styles.submitText}>{loading ? 'Učitavanje...' : 'Registruj se'}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.linkMuted}>Već imate nalog? Prijavite se</Text>
          </TouchableOpacity>
        </BlurView>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  back: {
    color: colors.softGreen,
    marginBottom: spacing.md,
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
    fontSize: 22,
    fontWeight: '600',
  },
  form: {
    padding: spacing.lg,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
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
  input: {
    color: colors.text,
    paddingVertical: 12,
    paddingHorizontal: 44,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  termsText: {
    marginLeft: spacing.sm,
    color: colors.muted,
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
