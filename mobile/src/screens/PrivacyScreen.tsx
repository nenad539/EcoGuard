import React from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing } from '../styles/common';
import { GradientBackground } from '../components/common/GradientBackground';
import { ScreenFade } from '../components/common/ScreenFade';
import { BackButton } from '../components/common/BackButton';
import { useLanguage } from '../lib/language';

export function PrivacyScreen() {
  const navigation = useNavigation();
  const { t } = useLanguage();

  return (
    <GradientBackground>
      <ScreenFade>
        <ScrollView contentContainerStyle={styles.content}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={styles.title}>{"Privatnost i dozvole"}</Text>
          <Text style={styles.body}>{"Va\u0161e osnovne informacije koristimo isklju\u010divo za funkcionisanje aplikacije (profil, poeni, rang)."}</Text>
          <Text style={styles.body}>{"Fotografije izazova se \u010duvaju radi provjere i dodjele poena. Ne dijelimo ih sa tre\u0107im stranama."}</Text>
          <Text style={styles.body}>{"U pode\u0161avanjima telefona mo\u017eete upravljati dozvolama za kameru i obavje\u0161tenja."}</Text>
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
