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
  const [selectedTip, setSelectedTip] = useState<EcoTip | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const tips = useMemo<EcoTip[]>(
    () => [
      {
        id: 1,
        title: "Gasi svetla",
        description: "Smanji potrosnju energije gasenjem svetla kada nisu potrebna.",
        details: "Koristi LED sijalice i iskljuci uredjaje iz uticnice kada ih ne koristis.",
        category: 'energy',
        icon: Zap,
        image:
          'https://images.unsplash.com/photo-1737372805905-be0b91ec86fb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlY28lMjB0aXBzJTIwc3VzdGFpbmFibGV8ZW58MXx8fHwxNzYwOTAyMzA4fDA&ixlib=rb-4.1.0&q=80&w=1080',
        impact: "Manja potrosnja struje",
      },
      {
        id: 2,
        title: "Razdvajaj otpad",
        description: "Odvajaj plastiku, papir i staklo kako bi reciklaza bila efikasna.",
        details: "Isperi ambalazu pre bacanja i koristi posebne kante za otpad.",
        category: 'recycling',
        icon: Recycle,
        image:
          'https://images.unsplash.com/photo-1654718421032-8aee5603b51f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxyZWN5Y2xpbmclMjBib3R0bGVzJTIwZWNvfGVufDF8fHx8MTc2MDg3OTYwNHww&ixlib=rb-4.1.0&q=80&w=1080',
        impact: "Manje otpada",
      },
      {
        id: 3,
        title: "Kreci se zelenije",
        description: "Biraj pesacenje, bicikl ili javni prevoz kad god mozes.",
        details: "Kratke voznje automobilom zameni pesacenjem ili biciklom.",
        category: 'transport',
        icon: Wind,
        image:
          'https://images.unsplash.com/photo-1656370465119-cb8d6735bda3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxjb21tdW5pdHklMjBwZW9wbGUlMjB0b2dldGhlcnxlbnwxfHx8fDE3NjA4NjEwNDd8MA&ixlib=rb-4.1.0&q=80&w=1080',
        impact: "Manje CO2",
      },
      {
        id: 4,
        title: "Stedi vodu",
        description: "Smanji potrosnju vode u kupatilu i kuhinji.",
        details: "Zatvori cesmu dok peres zube i koristi krace tusiranje.",
        category: 'water',
        icon: Droplet,
        image:
          'https://images.unsplash.com/photo-1580933907066-9a0a6fe5fc13?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxncmVlbiUyMGhvdXNlJTIwdHJlZXN8ZW58MXx8fHwxNzYwOTAyMzA4fDA&ixlib=rb-4.1.0&q=80&w=1080',
        impact: "Ustedjena voda",
      },
      {
        id: 5,
        title: "Visekratna upotreba",
        description: "Koristi visekratne kese i ambalazu umesto jednokratne.",
        details: "Ponesi svoju kesu i bocu kako bi smanjio plastiku.",
        category: 'home',
        icon: Home,
        image:
          'https://images.unsplash.com/photo-1580933907066-9a0a6fe5fc13?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxncmVlbiUyMGhvdXNlJTIwdHJlZXN8ZW58MXx8fHwxNzYwOTAyMzA4fDA&ixlib=rb-4.1.0&q=80&w=1080',
        impact: "Manje plastike",
      },
      {
        id: 6,
        title: "Ponovo iskoristi",
        description: "Popravi ili ponovo iskoristi stvari pre nego sto ih bacis.",
        details: "Doniraj odecu ili popravi uredjaje kad god je moguce.",
        category: 'recycling',
        icon: Recycle,
        image:
          'https://images.unsplash.com/photo-1654718421032-8aee5603b51f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxyZWN5Y2xpbmclMjBib3R0bGVzJTIwZWNvfGVufDF8fHx8MTc2MDg3OTYwNHww&ixlib=rb-4.1.0&q=80&w=1080',
        impact: "Manje bacanja",
      },
    ],
    []
  );
  const categories = useMemo(
    () => [
      { id: 'all', label: "Sve", icon: Lightbulb },
      { id: 'energy', label: "Energija", icon: Zap },
      { id: 'water', label: "Voda", icon: Droplet },
      { id: 'recycling', label: "Reciklaza", icon: Recycle },
      { id: 'transport', label: "Transport", icon: Wind },
      { id: 'home', label: "Dom", icon: Home },
    ],
    []
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
            <Text style={styles.title}>{"Eko saveti"}</Text>
            <Text style={styles.subtitle}>{"Prakticni saveti za svakodnevni zivot"}</Text>
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
