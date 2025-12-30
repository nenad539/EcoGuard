import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing } from '../../styles/common';

type ScreenContainerProps = {
  children: React.ReactNode;
  style?: ViewStyle;
};

export function ScreenContainer({ children, style }: ScreenContainerProps) {
  return <View style={[styles.container, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
});
