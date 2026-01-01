import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Leaf } from 'lucide-react-native';
import { colors, gradients, radius, spacing } from '../../styles/common';
import { triggerHaptic } from '../../lib/haptics';

type EmptyStateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ComponentType<{ size: number; color: string }>;
};

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon: Icon = Leaf,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <LinearGradient colors={gradients.primary} style={styles.iconWrap}>
        <Icon size={26} color={colors.text} />
      </LinearGradient>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {actionLabel && onAction ? (
        <TouchableOpacity
          onPress={() => {
            void triggerHaptic('selection');
            onAction();
          }}
          style={styles.actionButton}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center',
  },
  description: {
    color: colors.muted,
    marginTop: spacing.xs,
    textAlign: 'center',
    maxWidth: 240,
  },
  actionButton: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.4)',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  actionText: {
    color: colors.softGreen,
    fontWeight: '600',
  },
});
