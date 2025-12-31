import React from 'react';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { gradients, spacing } from '../../styles/common';

type GradientBackgroundProps = {
  children: React.ReactNode;
};

export function GradientBackground({ children }: GradientBackgroundProps) {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient
      colors={gradients.screen}
      style={[styles.container, { paddingTop: insets.top + spacing.md }]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
