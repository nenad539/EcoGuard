import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Recycle, Home, Users } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { colors, radius, spacing, gradients } from '../styles/common';
import { GradientBackground } from '../components/common/GradientBackground';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenFade } from '../components/common/ScreenFade';

const slides = [
  {
    title: 'Prati svoje ekološke navike',
    description: 'Zapisuj i prati sve svoje ekološke aktivnosti svakodnevno',
    image:
      'https://images.unsplash.com/photo-1654718421032-8aee5603b51f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZWN5Y2xpbmclMjBib3R0bGVzJTIwZWNvfGVufDF8fHx8MTc2MDg3OTYwNHww&ixlib=rb-4.1.0&q=80&w=1080',
    icon: Recycle,
  },
  {
    title: 'Smanji ugljeni otisak',
    description: 'Smanjuj svoj CO₂ otisak korak po korak',
    image:
      'https://images.unsplash.com/photo-1580933907066-9a0a6fe5fc13?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmVlbiUyMGhvdXNlJTIwdHJlZXN8ZW58MXx8fHwxNzYwOTAyMzA4fDA&ixlib=rb-4.1.0&q=80&w=1080',
    icon: Home,
  },
  {
    title: 'Udruži se s drugima',
    description: 'Pridruži se zajednici i podijeli svoje uspjehe',
    image:
      'https://images.unsplash.com/photo-1656370465119-cb8d6735bda3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21tdW5pdHklMjBwZW9wbGUlMjB0b2dldGhlcnxlbnwxfHx8fDE3NjA4NjEwNDd8MA&ixlib=rb-4.1.0&q=80&w=1080',
    icon: Users,
  },
];

export function OnboardingScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      navigation.navigate('Login');
    }
  };

  const handleSkip = () => {
    navigation.navigate('Login');
  };

  const SlideIcon = slides[currentSlide].icon;

  return (
    <GradientBackground>
      <ScreenFade>
        <View style={styles.container}>
          <View style={styles.skipRow}>
            <TouchableOpacity onPress={handleSkip}>
              <Text style={styles.skipText}>Preskoči</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.slideCard}>
            <View style={styles.iconBadge}>
              <SlideIcon size={26} color={colors.text} />
            </View>
            <View style={styles.imageWrap}>
              <Image source={{ uri: slides[currentSlide].image }} style={styles.image} />
            </View>
            <Text style={styles.title}>{slides[currentSlide].title}</Text>
            <Text style={styles.subtitle}>{slides[currentSlide].description}</Text>
          </View>

          <View style={styles.dotsRow}>
            {slides.map((_, index) => (
              <View
                key={`dot-${index}`}
                style={[styles.dot, index === currentSlide ? styles.dotActive : styles.dotInactive]}
              />
            ))}
          </View>

          <TouchableOpacity onPress={handleNext}>
            <LinearGradient colors={gradients.primary} style={styles.primaryButton}>
              <Text style={styles.primaryLabel}>
                {currentSlide < slides.length - 1 ? 'Dalje' : 'Započni sada'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.link}>
            <Text style={styles.linkText}>Nemate nalog? Registrujte se</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Terms')} style={styles.link}>
            <Text style={styles.linkMuted}>Uslovi korišćenja</Text>
          </TouchableOpacity>
        </View>
      </ScreenFade>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  skipRow: {
    alignItems: 'flex-end',
    marginBottom: spacing.sm,
  },
  skipText: {
    color: colors.muted,
    fontWeight: '600',
  },
  slideCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
    marginBottom: spacing.lg,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.25)',
    marginBottom: spacing.md,
  },
  imageWrap: {
    width: '100%',
    height: 220,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 24,
    color: colors.text,
    fontWeight: '600',
  },
  subtitle: {
    marginTop: spacing.sm,
    color: colors.muted,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotActive: {
    backgroundColor: colors.primary,
  },
  dotInactive: {
    backgroundColor: 'rgba(148, 163, 184, 0.4)',
  },
  primaryButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  primaryLabel: {
    color: colors.text,
    fontWeight: '600',
  },
  link: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  linkText: {
    color: colors.primary,
    fontWeight: '500',
  },
  linkMuted: {
    color: colors.muted,
  },
});
