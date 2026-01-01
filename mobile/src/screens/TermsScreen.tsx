import React from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing } from '../styles/common';
import { GradientBackground } from '../components/common/GradientBackground';
import { ScreenFade } from '../components/common/ScreenFade';
import { BackButton } from '../components/common/BackButton';

export function TermsScreen() {
  const navigation = useNavigation();
  return (
    <GradientBackground>
      <ScreenFade>
        <ScrollView contentContainerStyle={styles.content}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.title}>{"Uslovi kori\u0161\u0107enja"}</Text>
        <Text style={styles.body}>{"Kori\u0161\u0107enjem aplikacije pristajete na prikupljanje osnovnih podataka za nagrade, rangiranje i aktivnosti."}</Text>
        <Text style={styles.body}>{"Va\u0161e fotografije izazova podlije\u017eu provjeri prije dodjele poena. Dijelite autenti\u010dne aktivnosti."}</Text>
        </ScrollView>
      </ScreenFade>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  body: {
    color: colors.muted,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
});
