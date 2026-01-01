import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../../styles/common';
import { triggerHaptic } from '../../lib/haptics';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
};

export function PrimaryButton({ label, onPress, disabled, style }: PrimaryButtonProps) {
  return (
    <TouchableOpacity
      onPress={() => {
        if (disabled) return;
        void triggerHaptic('selection');
        onPress();
      }}
      disabled={disabled}
      style={[styles.button, disabled && styles.disabled, style]}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(disabled) }}
    >
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.6,
  },
  label: {
    color: '#0b1220',
    fontWeight: '700',
  },
});
