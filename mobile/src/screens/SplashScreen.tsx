import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Leaf, Shield } from 'lucide-react-native';
import { colors, spacing } from '../styles/common';
import { GradientBackground } from '../components/common/GradientBackground';

export function SplashScreen() {
  return (
    <GradientBackground>
      <View style={styles.container}>
        <View style={styles.logoCircle}>
          <Shield size={56} color={colors.primary} />
          <Leaf size={28} color={colors.primaryDark} style={styles.leaf} />
        </View>
        <Text style={styles.brand}>{"GrowWithUs"}</Text>
        <Text style={styles.subtitle}>{"\u010cuvaj prirodu."}</Text>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
    marginBottom: spacing.md,
  },
  leaf: {
    position: 'absolute',
  },
  brand: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '600',
  },
  subtitle: {
    color: colors.softGreen,
    marginTop: spacing.xs,
  },
});
