import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gradients } from '../../styles/common';

type GradientBackgroundProps = {
  children: React.ReactNode;
};

export function GradientBackground({ children }: GradientBackgroundProps) {
  return (
    <LinearGradient colors={gradients.screen} style={styles.container}>
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
