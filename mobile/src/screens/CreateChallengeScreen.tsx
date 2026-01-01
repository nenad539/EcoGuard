import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { colors, radius, spacing, gradients } from '../styles/common';
import { FormInput } from '../components/common/FormInput';
import { supabase } from '../lib/supabase';
import { GradientBackground } from '../components/common/GradientBackground';
import { LinearGradient } from 'expo-linear-gradient';
import { showError, showSuccess } from '../lib/toast';
import { ScreenFade } from '../components/common/ScreenFade';
import { BackButton } from '../components/common/BackButton';
import { GlowCard } from '../components/common/GlowCard';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

export function CreateChallengeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [durationDays, setDurationDays] = useState('7');
  const [points, setPoints] = useState('100');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title || !points || !durationDays) {
      showError("Gre\u0161ka", "Popunite obavezna polja.");
      return;
    }

    const days = Number(durationDays);
    if (!Number.isFinite(days) || days <= 0) {
      showError("Gre\u0161ka", "Trajanje mora biti pozitivan broj.");
      return;
    }

    const pointsValue = Number(points);
    if (!Number.isFinite(pointsValue) || pointsValue <= 0) {
      showError("Gre\u0161ka", "Poeni moraju biti pozitivan broj.");
      return;
    }

    const { data: auth } = await supabase.auth.getUser();
    const userId = auth?.user?.id;
    if (!userId) {
      showError("Gre\u0161ka", "Morate biti prijavljeni.");
      return;
    }

    const start = new Date();
    const end = new Date();
    end.setDate(start.getDate() + days);

    const payload = {
      title,
      description,
      location,
      points: pointsValue,
      createdBy: userId,
      startAt: start.toISOString().split('T')[0],
      endAt: end.toISOString().split('T')[0],
      time_limit: `${days}d`,
      status: 'available',
    };

    setIsSubmitting(true);
    const { error } = await supabase.from('photoChallenge').insert(payload);
    setIsSubmitting(false);

    if (error) {
      showError("Gre\u0161ka", error.message);
      return;
    }

    showSuccess("Uspjeh", "Foto izazov je kreiran.");
    setTitle('');
    setDescription('');
    setLocation('');
    setDurationDays('7');
    setPoints('100');
  };

  return (
    <GradientBackground>
      <ScreenFade>
        <View style={styles.container}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={styles.title}>{"Kreiraj foto izazov"}</Text>
          <GlowCard contentStyle={styles.card}>
            <FormInput label={"Naziv izazova"} value={title} onChangeText={setTitle} />
            <FormInput
              label={"Opis"}
              value={description}
              onChangeText={setDescription}
            />
            <FormInput
              label={"Lokacija"}
              value={location}
              onChangeText={setLocation}
            />
            <FormInput
              label={"Trajanje (dana)"}
              value={durationDays}
              onChangeText={setDurationDays}
              keyboardType="numeric"
            />
            <FormInput
              label={"Poeni"}
              value={points}
              onChangeText={setPoints}
              keyboardType="numeric"
            />
            <TouchableOpacity onPress={handleSubmit} disabled={isSubmitting}>
              <LinearGradient colors={gradients.primary} style={styles.actionButton}>
                {isSubmitting ? (
                  <ActivityIndicator color={colors.text} />
                ) : (
                  <Text style={styles.actionLabel}>{"Sacuvaj izazov"}</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </GlowCard>
        </View>
      </ScreenFade>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  card: {
    padding: spacing.md,
    borderRadius: radius.md,
  },
  actionButton: {
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  actionLabel: {
    color: colors.text,
    fontWeight: '600',
  },
});
