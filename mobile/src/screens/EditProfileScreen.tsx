import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { ArrowLeft, Lock, User, Eye, EyeOff } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';
import { colors, radius, spacing, gradients } from '../styles/common';
import { GradientBackground } from '../components/common/GradientBackground';
import { showError, showSuccess } from '../lib/toast';
import { ScreenFade } from '../components/common/ScreenFade';
import { GlowCard } from '../components/common/GlowCard';
import { useLanguage } from '../lib/language';

export function EditProfileScreen() {
  const navigation = useNavigation();
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [loadingName, setLoadingName] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
        .maybeSingle();

      setName(data?.korisnicko_ime ?? '');
    };

    loadProfile();
  }, []);

  const handleSaveName = async () => {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth?.user?.id;
    if (!userId) return;

    if (!name.trim()) {
      showError("Gre\u0161ka", t('editProfileNameMissing'));
      return;
    }

    setLoadingName(true);
    const { error } = await supabase
      .from('korisnik_profil')
      .update({ korisnicko_ime: name.trim() })
      .eq('id', userId);

    setLoadingName(false);

    if (error) {
      showError("Gre\u0161ka", error.message);
      return;
    }

    showSuccess("Uspjeh", t('editProfileNameSaved'));
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      showError("Gre\u0161ka", t('editProfilePasswordMissing'));
      return;
    }

    if (newPassword.length < 6) {
      showError("Gre\u0161ka", t('editProfilePasswordLength'));
      return;
    }

    if (newPassword !== confirmPassword) {
      showError("Gre\u0161ka", t('editProfilePasswordMismatch'));
      return;
    }

    setLoadingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoadingPassword(false);

    if (error) {
      showError("Gre\u0161ka", error.message);
      return;
    }

    setNewPassword('');
    setConfirmPassword('');
    showSuccess("Uspjeh", t('editProfilePasswordSaved'));
  };

  return (
    <GradientBackground>
      <ScreenFade>
        <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={18} color={colors.softGreen} />
          <Text style={styles.backText}>{"Nazad"}</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{t('editProfileTitle')}</Text>
        <Text style={styles.subtitle}>{t('editProfileSubtitle')}</Text>

        <GlowCard contentStyle={styles.card}>
          <View style={styles.cardHeader}>
            <LinearGradient colors={gradients.primary} style={styles.iconBadge}>
              <User size={16} color={colors.text} />
            </LinearGradient>
            <Text style={styles.cardTitle}>{t('editProfileBasicsTitle')}</Text>
          </View>

          <Text style={styles.label}>{t('editProfileNameLabel')}</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={t('editProfileNamePlaceholder')}
              placeholderTextColor={colors.muted}
              style={styles.input}
            />
          </View>

          <TouchableOpacity onPress={handleSaveName} disabled={loadingName}>
            <LinearGradient colors={gradients.primary} style={styles.primaryButton}>
              <Text style={styles.primaryText}>
                {loadingName ? t('savingLabel') : t('editProfileSaveNameLabel')}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </GlowCard>

        <GlowCard contentStyle={styles.card}>
          <View style={styles.cardHeader}>
            <LinearGradient colors={gradients.primary} style={styles.iconBadge}>
              <Lock size={16} color={colors.text} />
            </LinearGradient>
            <Text style={styles.cardTitle}>{t('editProfilePasswordTitle')}</Text>
          </View>

          <Text style={styles.label}>{t('editProfileNewPasswordLabel')}</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.muted}
              secureTextEntry={!showNewPassword}
              style={styles.input}
            />
            <TouchableOpacity
              onPress={() => setShowNewPassword((prev) => !prev)}
              style={styles.toggleButton}
            >
              {showNewPassword ? (
                <EyeOff color={colors.muted} size={18} />
              ) : (
                <Eye color={colors.muted} size={18} />
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>{t('editProfileConfirmPasswordLabel')}</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.muted}
              secureTextEntry={!showConfirmPassword}
              style={styles.input}
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword((prev) => !prev)}
              style={styles.toggleButton}
            >
              {showConfirmPassword ? (
                <EyeOff color={colors.muted} size={18} />
              ) : (
                <Eye color={colors.muted} size={18} />
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={handleResetPassword} disabled={loadingPassword}>
            <LinearGradient colors={gradients.primary} style={styles.primaryButton}>
              <Text style={styles.primaryText}>
                {loadingPassword ? t('updatingLabel') : t('editProfileSavePasswordLabel')}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </GlowCard>
        </View>
      </ScreenFade>
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
    borderRadius: radius.lg,
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
    position: 'relative',
  },
  input: {
    color: colors.text,
    paddingVertical: 12,
    paddingHorizontal: 12,
    paddingRight: 40,
  },
  toggleButton: {
    position: 'absolute',
    right: 10,
    top: 12,
    padding: 4,
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
