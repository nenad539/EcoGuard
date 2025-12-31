import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Leaf } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { colors, radius, spacing, gradients } from '../styles/common';
import { GradientBackground } from '../components/common/GradientBackground';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenFade } from '../components/common/ScreenFade';

export function OnboardingScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <GradientBackground>
      <ScreenFade>
        <View style={styles.container}>
        <View style={styles.hero}>
          <Leaf size={48} color={colors.primary} />
          <Text style={styles.title}>Dobro došli u EcoGuard</Text>
          <Text style={styles.subtitle}>
            Pratite svoj doprinos i učestvujte u dnevnim i foto izazovima.
          </Text>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <LinearGradient colors={gradients.primary} style={styles.primaryButton}>
            <Text style={styles.primaryLabel}>Prijava</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.link}>
          <Text style={styles.linkText}>Nemate nalog? Registrujte se</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Terms')} style={styles.link}>
          <Text style={styles.linkMuted}>Uslovi korišćenja</Text>
        </TouchableOpacity>
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
  hero: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    padding: spacing.lg,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    marginTop: spacing.sm,
    fontSize: 24,
    color: colors.text,
    fontWeight: '600',
  },
  subtitle: {
    marginTop: spacing.sm,
    color: colors.muted,
  },
  primaryButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  primaryLabel: {
    color: colors.text,
    fontWeight: '600',
  },
  link: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  linkText: {
    color: colors.primary,
    fontWeight: '500',
  },
  linkMuted: {
    color: colors.muted,
  },
});
