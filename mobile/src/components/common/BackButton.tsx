import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { colors, spacing } from '../../styles/common';

type BackButtonProps = {
  label?: string;
  onPress: () => void;
};

export function BackButton({ label = 'Nazad', onPress }: BackButtonProps) {
  return (
    <TouchableOpacity style={styles.backButton} onPress={onPress}>
      <ArrowLeft size={18} color={colors.softGreen} />
      <Text style={styles.backText}>{label}</Text>
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
