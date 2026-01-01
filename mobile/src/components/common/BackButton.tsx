import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { colors, spacing } from '../../styles/common';
import { triggerHaptic } from '../../lib/haptics';
import { useLanguage } from '../../lib/language';

type BackButtonProps = {
  label?: string;
  onPress: () => void;
};

export function BackButton({ label = 'Nazad', onPress }: BackButtonProps) {
  const { t } = useLanguage();
  const resolvedLabel = label === 'Nazad' ? "Nazad" : label;

  return (
    <TouchableOpacity
      style={styles.backButton}
      accessibilityRole="button"
      accessibilityLabel={resolvedLabel}
      onPress={() => {
        void triggerHaptic('selection');
        onPress();
      }}
    >
      <ArrowLeft size={18} color={colors.softGreen} />
      <Text style={styles.backText}>{resolvedLabel}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  backText: {
    color: colors.softGreen,
  },
});
