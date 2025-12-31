import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing } from '../../styles/common';

const innerRadius = Math.max(radius.lg - 2, radius.md);
const DEFAULT_GRADIENT = ['rgba(34, 197, 94, 0.28)', 'rgba(15, 23, 42, 0.95)'] as const;

type GlowCardProps = {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  contentStyle?: ViewStyle | ViewStyle[];
  gradient?: readonly [string, string, ...string[]];
};

export function GlowCard({ children, style, contentStyle, gradient }: GlowCardProps) {
  return (
    <LinearGradient colors={gradient ?? DEFAULT_GRADIENT} style={[styles.shell, style]}>
      <View style={[styles.inner, contentStyle]}>{children}</View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  shell: {
    padding: 1.5,
    borderRadius: radius.lg,
    backgroundColor: colors.backgroundDark,
  },
  inner: {
    borderRadius: innerRadius,
    backgroundColor: colors.cardAlt,
    padding: spacing.md,
  },
});
