import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { ArrowLeft, Lock, User } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';
import { colors, radius, spacing, gradients } from '../styles/common';
import { GradientBackground } from '../components/common/GradientBackground';
import { showError, showSuccess } from '../lib/toast';

export function EditProfileScreen() {
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [loadingName, setLoadingName] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loadingPassword, setLoadingPassword] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id;
      if (!userId) return;

      const { data } = await supabase
        .from('korisnik_profil')
        .select('korisnicko_ime')
        .eq('id', userId)
        .single();

      setName(data?.korisnicko_ime ?? '');
    };

    loadProfile();
  }, []);

  const handleSaveName = async () => {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth?.user?.id;
    if (!userId) return;

    if (!name.trim()) {
      showError('Greška', 'Unesite korisničko ime.');
      return;
    }

    setLoadingName(true);
    const { error } = await supabase
      .from('korisnik_profil')
      .update({ korisnicko_ime: name.trim() })
      .eq('id', userId);

    setLoadingName(false);

    if (error) {
      showError('Greška', error.message);
      return;
    }

    showSuccess('Sačuvano', 'Ime je ažurirano.');
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      showError('Greška', 'Popunite oba polja za lozinku.');
      return;
    }

    if (newPassword.length < 6) {
      showError('Greška', 'Lozinka mora imati najmanje 6 karaktera.');
      return;
    }

    if (newPassword !== confirmPassword) {
      showError('Greška', 'Lozinke se ne poklapaju.');
      return;
    }

    setLoadingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoadingPassword(false);

    if (error) {
      showError('Greška', error.message);
      return;
    }

    setNewPassword('');
    setConfirmPassword('');
    showSuccess('Uspeh', 'Lozinka je promenjena.');
  };

  return (
    <GradientBackground>
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={18} color={colors.softGreen} />
          <Text style={styles.backText}>Nazad</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Uredi profil</Text>
        <Text style={styles.subtitle}>Ažuriraj podatke svog naloga</Text>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <LinearGradient colors={gradients.primary} style={styles.iconBadge}>
              <User size={16} color={colors.text} />
            </LinearGradient>
            <Text style={styles.cardTitle}>Osnovni podaci</Text>
          </View>

          <Text style={styles.label}>Korisničko ime</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Unesite ime"
              placeholderTextColor={colors.muted}
              style={styles.input}
            />
          </View>

          <TouchableOpacity onPress={handleSaveName} disabled={loadingName}>
            <LinearGradient colors={gradients.primary} style={styles.primaryButton}>
              <Text style={styles.primaryText}>{loadingName ? 'Čuvanje...' : 'Sačuvaj ime'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <LinearGradient colors={gradients.primary} style={styles.iconBadge}>
              <Lock size={16} color={colors.text} />
            </LinearGradient>
            <Text style={styles.cardTitle}>Promjena lozinke</Text>
          </View>

          <Text style={styles.label}>Nova lozinka</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.muted}
              secureTextEntry
              style={styles.input}
            />
          </View>

          <Text style={styles.label}>Potvrda lozinke</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.muted}
              secureTextEntry
              style={styles.input}
            />
          </View>

          <TouchableOpacity onPress={handleResetPassword} disabled={loadingPassword}>
            <LinearGradient colors={gradients.primary} style={styles.primaryButton}>
              <Text style={styles.primaryText}>
                {loadingPassword ? 'Ažuriranje...' : 'Promijeni lozinku'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  backText: {
    color: colors.softGreen,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '600',
  },
  subtitle: {
    color: colors.softGreen,
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 16,
  },
  label: {
    color: colors.softGreen,
    marginBottom: spacing.xs,
  },
  inputWrapper: {
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#4b5563',
    marginBottom: spacing.md,
  },
  input: {
    color: colors.text,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  primaryButton: {
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  primaryText: {
    color: colors.text,
    fontWeight: '600',
  },
});
