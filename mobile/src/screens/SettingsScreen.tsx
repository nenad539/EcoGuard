import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { ArrowLeft, Bell, Globe, Shield, Info, ChevronRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing, gradients } from '../styles/common';
import { GradientBackground } from '../components/common/GradientBackground';

export function SettingsScreen() {
  const navigation = useNavigation();
  const [settings, setSettings] = useState({
    notifications: true,
  });

  const sections = [
    {
      title: 'Obavještenja',
      items: [
        {
          id: 'notifications',
          icon: Bell,
          label: 'Push obavještenja',
          description: 'Primaj obavještenja o novim izazovima',
          type: 'toggle' as const,
          value: settings.notifications,
          onChange: (value: boolean) => setSettings({ ...settings, notifications: value }),
        },
      ],
    },
    {
      title: 'Jezik i region',
      items: [
        {
          id: 'language',
          icon: Globe,
          label: 'Jezik',
          description: 'Srpski / Engleski',
          type: 'link' as const,
        },
      ],
    },
    {
      title: 'Privatnost i bezbjednost',
      items: [
        {
          id: 'privacy',
          icon: Shield,
          label: 'Privatnost i dozvole',
          description: 'Upravljaj pristupom aplikaciji',
          type: 'link' as const,
        },
        {
          id: 'terms',
          icon: Info,
          label: 'Uslovi korišćenja',
          description: 'Pročitaj pravila korišćenja',
          type: 'link' as const,
          onPress: () => navigation.navigate('Terms' as never),
        },
      ],
    },
  ];

  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <ArrowLeft size={18} color={colors.softGreen} />
            <Text style={styles.backText}>Nazad</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Podešavanja</Text>
          <Text style={styles.subtitle}>Prilagodi svoju aplikaciju</Text>
        </View>

        <View style={styles.sections}>
          {sections.map((section) => (
            <View key={section.title} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.sectionContainer}>
                {section.items.map((item, index) => (
                  <View key={item.id}>
                    <TouchableOpacity
                      style={styles.item}
                      onPress={() => {
                        if (item.type === 'link' && item.onPress) item.onPress();
                      }}
                      disabled={item.type === 'toggle'}
                    >
                      <LinearGradient colors={gradients.primary} style={styles.itemIcon}>
                        <item.icon size={18} color={colors.text} />
                      </LinearGradient>
                      <View style={styles.itemContent}>
                        <Text style={styles.itemLabel}>{item.label}</Text>
                        <Text style={styles.itemDescription}>{item.description}</Text>
                      </View>
                      {item.type === 'toggle' ? (
                        <Switch value={item.value} onValueChange={item.onChange} />
                      ) : (
                        <ChevronRight size={18} color={colors.muted} />
                      )}
                    </TouchableOpacity>
                    {index < section.items.length - 1 && <View style={styles.separator} />}
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>

        <View style={styles.appInfoCard}>
          <Text style={styles.appEmoji}>🌱</Text>
          <Text style={styles.appTitle}>GrowWithUs</Text>
          <Text style={styles.appDescription}>Čuvaj prirodu.</Text>
          <Text style={styles.appDetail}>Verzija 1.0.0</Text>
          <Text style={styles.appDetail}>© 2025 GrowWithUs Nenad</Text>
        </View>

        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>Kontakt i podrška</Text>
          <TouchableOpacity style={styles.contactButton}>
            <Text style={styles.contactText}>📧 support@growwithus.com</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactButton}>
            <Text style={styles.contactText}>🌐 www.growwithus.com</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactButton}>
            <Text style={styles.contactText}>📱 Pratite nas na društvenim mrežama</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xl,
  },
  header: {
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  backText: {
    color: colors.softGreen,
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
  sections: {
    paddingHorizontal: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  sectionContainer: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemContent: {
    flex: 1,
  },
  itemLabel: {
    color: colors.text,
    fontWeight: '500',
  },
  itemDescription: {
    color: colors.muted,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 64,
  },
  appInfoCard: {
    marginTop: spacing.md,
    marginHorizontal: spacing.lg,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    alignItems: 'center',
  },
  appEmoji: {
    fontSize: 36,
    marginBottom: spacing.sm,
  },
  appTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
  appDescription: {
    color: colors.softGreen,
    marginTop: spacing.xs,
  },
  appDetail: {
    color: colors.muted,
    marginTop: spacing.xs,
  },
  contactCard: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  contactTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  contactButton: {
    paddingVertical: spacing.sm,
  },
  contactText: {
    color: colors.muted,
  },
});
