import React, { useMemo, useState } from 'react';
import { ScrollView, Text, StyleSheet, View, TouchableOpacity, Modal, Image } from 'react-native';
import { Lightbulb, Zap, Droplet, Recycle, Home, Wind, X } from 'lucide-react-native';
import { colors, radius, spacing, gradients } from '../styles/common';
import { GradientBackground } from '../components/common/GradientBackground';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenFade } from '../components/common/ScreenFade';
import { BackButton } from '../components/common/BackButton';
import { GlowCard } from '../components/common/GlowCard';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useLanguage } from '../lib/language';

type EcoTip = {
  id: number;
  title: string;
  description: string;
  details: string;
  category: 'energy' | 'water' | 'recycling' | 'transport' | 'home';
  icon: any;
  image: string;
  impact: string;
};

export function EcoTipsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t } = useLanguage();
  const [selectedTip, setSelectedTip] = useState<EcoTip | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const tips = useMemo<EcoTip[]>(
    () => [
      {
        id: 1,
        title: t('ecoTip1Title'),
        description: t('ecoTip1Description'),
        details: t('ecoTip1Details'),
        category: 'energy',
        icon: Zap,
        image:
          'https://images.unsplash.com/photo-1737372805905-be0b91ec86fb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlY28lMjB0aXBzJTIwc3VzdGFpbmFibGV8ZW58MXx8fHwxNzYwOTAyMzA4fDA&ixlib=rb-4.1.0&q=80&w=1080',
        impact: t('ecoTip1Impact'),
      },
      {
        id: 2,
        title: t('ecoTip2Title'),
        description: t('ecoTip2Description'),
        details: t('ecoTip2Details'),
        category: 'recycling',
        icon: Recycle,
        image:
          'https://images.unsplash.com/photo-1654718421032-8aee5603b51f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxyZWN5Y2xpbmclMjBib3R0bGVzJTIwZWNvfGVufDF8fHx8MTc2MDg3OTYwNHww&ixlib=rb-4.1.0&q=80&w=1080',
        impact: t('ecoTip2Impact'),
      },
      {
        id: 3,
        title: t('ecoTip3Title'),
        description: t('ecoTip3Description'),
        details: t('ecoTip3Details'),
        category: 'transport',
        icon: Wind,
        image:
          'https://images.unsplash.com/photo-1656370465119-cb8d6735bda3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxjb21tdW5pdHklMjBwZW9wbGUlMjB0b2dldGhlcnxlbnwxfHx8fDE3NjA4NjEwNDd8MA&ixlib=rb-4.1.0&q=80&w=1080',
        impact: t('ecoTip3Impact'),
      },
      {
        id: 4,
        title: t('ecoTip4Title'),
        description: t('ecoTip4Description'),
        details: t('ecoTip4Details'),
        category: 'water',
        icon: Droplet,
        image:
          'https://images.unsplash.com/photo-1580933907066-9a0a6fe5fc13?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxncmVlbiUyMGhvdXNlJTIwdHJlZXN8ZW58MXx8fHwxNzYwOTAyMzA4fDA&ixlib=rb-4.1.0&q=80&w=1080',
        impact: t('ecoTip4Impact'),
      },
      {
        id: 5,
        title: t('ecoTip5Title'),
        description: t('ecoTip5Description'),
        details: t('ecoTip5Details'),
        category: 'home',
        icon: Home,
        image:
          'https://images.unsplash.com/photo-1580933907066-9a0a6fe5fc13?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxncmVlbiUyMGhvdXNlJTIwdHJlZXN8ZW58MXx8fHwxNzYwOTAyMzA4fDA&ixlib=rb-4.1.0&q=80&w=1080',
        impact: t('ecoTip5Impact'),
      },
      {
        id: 6,
        title: t('ecoTip6Title'),
        description: t('ecoTip6Description'),
        details: t('ecoTip6Details'),
        category: 'recycling',
        icon: Recycle,
        image:
          'https://images.unsplash.com/photo-1654718421032-8aee5603b51f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxyZWN5Y2xpbmclMjBib3R0bGVzJTIwZWNvfGVufDF8fHx8MTc2MDg3OTYwNHww&ixlib=rb-4.1.0&q=80&w=1080',
        impact: t('ecoTip6Impact'),
      },
    ],
    [t]
  );
  const categories = useMemo(
    () => [
      { id: 'all', label: t('ecoCategoryAll'), icon: Lightbulb },
      { id: 'energy', label: t('ecoCategoryEnergy'), icon: Zap },
      { id: 'water', label: t('ecoCategoryWater'), icon: Droplet },
      { id: 'recycling', label: t('ecoCategoryRecycling'), icon: Recycle },
      { id: 'transport', label: t('ecoCategoryTransport'), icon: Wind },
      { id: 'home', label: t('ecoCategoryHome'), icon: Home },
    ],
    [t]
  );
  const categoryLabelMap = useMemo(
    () =>
      categories.reduce<Record<string, string>>((acc, category) => {
        acc[category.id] = category.label;
        return acc;
      }, {}),
    [categories]
  );

  const filteredTips = useMemo(() => {
    return selectedCategory === 'all'
      ? tips
      : tips.filter((tip) => tip.category === selectedCategory);
  }, [selectedCategory, tips]);

  return (
    <GradientBackground>
      <ScreenFade>
        <ScrollView contentContainerStyle={styles.content}>
          <BackButton onPress={() => navigation.goBack()} />
          <View style={styles.header}>
            <Text style={styles.title}>{t('ecoTipsTitle')}</Text>
            <Text style={styles.subtitle}>{t('ecoTipsSubtitle')}</Text>
          </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRow}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[styles.categoryChip, selectedCategory === category.id && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <category.icon size={16} color={selectedCategory === category.id ? colors.softGreen : colors.muted} />
              <Text
                style={[styles.categoryText, selectedCategory === category.id && styles.categoryTextActive]}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.cardGrid}>
          {filteredTips.map((tip) => (
            <TouchableOpacity key={tip.id} style={styles.cardShell} onPress={() => setSelectedTip(tip)}>
              <GlowCard contentStyle={styles.card}>
                <Image source={{ uri: tip.image }} style={styles.cardImage} />
                <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <LinearGradient colors={gradients.primary} style={styles.iconBadge}>
                      <tip.icon size={16} color={colors.text} />
                    </LinearGradient>
                    <Text style={styles.cardTitle}>{tip.title}</Text>
                  </View>
                  <Text style={styles.cardDescription}>{tip.description}</Text>
                  <View style={styles.impactTag}>
                    <Text style={styles.impactText}>{tip.impact}</Text>
                  </View>
                </View>
              </GlowCard>
            </TouchableOpacity>
          ))}
        </View>

          <Modal visible={Boolean(selectedTip)} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
              <View style={styles.modalCard}>
                <TouchableOpacity style={styles.modalClose} onPress={() => setSelectedTip(null)}>
                  <X size={18} color={colors.muted} />
                </TouchableOpacity>
                {selectedTip ? (
                  <ScrollView>
                    <Image source={{ uri: selectedTip.image }} style={styles.modalImage} />
                    <Text style={styles.modalTitle}>{selectedTip.title}</Text>
                    <Text style={styles.modalCategory}>
                      {categoryLabelMap[selectedTip.category] ?? selectedTip.category.toUpperCase()}
                    </Text>
                    <Text style={styles.modalDescription}>{selectedTip.description}</Text>
                    <Text style={styles.modalDetails}>{selectedTip.details}</Text>
                    <View style={styles.modalImpact}>
                      <Text style={styles.modalImpactText}>{selectedTip.impact}</Text>
                    </View>
                  </ScrollView>
                ) : null}
              </View>
            </View>
          </Modal>
        </ScrollView>
      </ScreenFade>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  header: {
    paddingTop: spacing.xl,
    marginBottom: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '600',
  },
  subtitle: {
    color: colors.softGreen,
    marginTop: spacing.xs,
  },
  categoryRow: {
    marginBottom: spacing.md,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    marginRight: spacing.sm,
  },
  categoryChipActive: {
    borderColor: 'rgba(34, 197, 94, 0.3)',
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  categoryText: {
    color: colors.muted,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: colors.softGreen,
  },
  cardGrid: {
    gap: spacing.md,
  },
  cardShell: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  card: {
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 180,
  },
  cardContent: {
    padding: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    color: colors.text,
    fontWeight: '600',
    flex: 1,
  },
  cardDescription: {
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  impactTag: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  impactText: {
    color: colors.softGreen,
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: spacing.md,
  },
  modalCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.97)',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    maxHeight: '90%',
  },
  modalClose: {
    alignSelf: 'flex-end',
    padding: spacing.xs,
  },
  modalImage: {
    width: '100%',
    height: 200,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '600',
  },
  modalCategory: {
    color: colors.softGreen,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  modalDescription: {
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  modalDetails: {
    color: colors.text,
    lineHeight: 20,
  },
  modalImpact: {
    marginTop: spacing.md,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  modalImpactText: {
    color: colors.softGreen,
    fontWeight: '600',
  },
});
