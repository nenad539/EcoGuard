import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { colors, radius, spacing, gradients } from '../styles/common';
import { FormInput } from '../components/common/FormInput';
import { supabase } from '../lib/supabase';
import { GradientBackground } from '../components/common/GradientBackground';
import { LinearGradient } from 'expo-linear-gradient';

export function CreateChallengeScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [points, setPoints] = useState('100');
  const [type, setType] = useState<'regular' | 'photo'>('regular');

  const handleSubmit = async () => {
    if (!title || !points) {
      Alert.alert('Greška', 'Unesite naziv i poene.');
      return;
    }

    const payload = {
      title,
      description,
      points: Number(points),
    };

    const table = type === 'photo' ? 'photoChallenge' : 'dailyChallenge';
    const { error } = await supabase.from(table).insert(payload);

    if (error) {
      Alert.alert('Greška', error.message);
      return;
    }

    Alert.alert('Uspjeh', 'Izazov je kreiran.');
    setTitle('');
    setDescription('');
    setPoints('100');
  };

  return (
    <GradientBackground>
      <View style={styles.container}>
        <Text style={styles.title}>Kreiraj izazov</Text>
        <View style={styles.card}>
        <View style={styles.typeRow}>
          <TouchableOpacity
            style={[styles.typeButton, type === 'regular' && styles.typeActive]}
            onPress={() => setType('regular')}
          >
            <Text style={styles.typeLabel}>Regular</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeButton, type === 'photo' && styles.typeActive]}
            onPress={() => setType('photo')}
          >
            <Text style={styles.typeLabel}>Foto</Text>
          </TouchableOpacity>
        </View>
        <FormInput label="Naziv" value={title} onChangeText={setTitle} />
        <FormInput label="Opis" value={description} onChangeText={setDescription} />
        <FormInput label="Poeni" value={points} onChangeText={setPoints} keyboardType="numeric" />
        <TouchableOpacity onPress={handleSubmit}>
          <LinearGradient colors={gradients.primary} style={styles.actionButton}>
            <Text style={styles.actionLabel}>Kreiraj</Text>
          </LinearGradient>
        </TouchableOpacity>
        </View>
      </View>
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
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  typeButton: {
    flex: 1,
    backgroundColor: colors.cardAlt,
    padding: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  typeActive: {
    borderColor: colors.primary,
    borderWidth: 1,
  },
  typeLabel: {
    color: colors.text,
    fontWeight: '500',
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
