import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../styles/common';

const BaseToast = ({ title, message, accent }: { title?: string; message?: string; accent: string }) => (
  <View style={[styles.container, { borderLeftColor: accent }]}> 
    {title ? <Text style={styles.title}>{title}</Text> : null}
    {message ? <Text style={styles.message}>{message}</Text> : null}
  </View>
);

export const toastConfig = {
  success: ({ text1, text2 }: { text1?: string; text2?: string }) => (
    <BaseToast title={text1} message={text2} accent={colors.primary} />
  ),
  error: ({ text1, text2 }: { text1?: string; text2?: string }) => (
    <BaseToast title={text1} message={text2} accent="#f87171" />
  ),
  info: ({ text1, text2 }: { text1?: string; text2?: string }) => (
    <BaseToast title={text1} message={text2} accent="#38bdf8" />
  ),
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: radius.md,
    borderLeftWidth: 4,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    color: colors.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  message: {
    color: colors.muted,
    fontSize: 12,
  },
});
