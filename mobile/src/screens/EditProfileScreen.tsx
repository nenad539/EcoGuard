import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { colors, radius, spacing, gradients } from '../styles/common';
import { FormInput } from '../components/common/FormInput';
import { GradientBackground } from '../components/common/GradientBackground';

export function EditProfileScreen() {
  const navigation = useNavigation();
  const [name, setName] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id;
      if (!userId) return;

      const { data } = await supabase
        .from('korisnik_profil')
        .select('korisnicko_ime')
        .eq('id', userId)
        .single();

      setName(data?.korisnicko_ime ?? '');
    };

    loadProfile();
  }, []);

  const handleSave = async () => {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth?.user?.id;
    if (!userId) return;

    const { error } = await supabase
      .from('korisnik_profil')
      .update({ korisnicko_ime: name })
      .eq('id', userId);

    if (error) {
      Alert.alert('Greška', error.message);
      return;
    }

    Alert.alert('Sačuvano', 'Profil je ažuriran.');
    navigation.goBack();
  };

  return (
    <GradientBackground>
      <View style={styles.container}>
        <Text style={styles.title}>Uredi profil</Text>
        <BlurView intensity={25} tint="dark" style={styles.card}>
          <FormInput label="Korisničko ime" value={name} onChangeText={setName} />
          <TouchableOpacity onPress={handleSave}>
            <LinearGradient colors={gradients.primary} style={styles.actionButton}>
              <Text style={styles.actionLabel}>Sačuvaj</Text>
            </LinearGradient>
          </TouchableOpacity>
        </BlurView>
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
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
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
