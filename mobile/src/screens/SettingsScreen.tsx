import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { Bell, Shield, Info, ChevronRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing, gradients } from '../styles/common';
import { GradientBackground } from '../components/common/GradientBackground';
import { ScreenFade } from '../components/common/ScreenFade';
import { supabase } from '../lib/supabase';
import { GlowCard } from '../components/common/GlowCard';

export function SettingsScreen() {
  const navigation = useNavigation();
  const [settings, setSettings] = useState({
    notifications: true,
  });
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const loadAdmin = async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data?.user?.id;
      if (!uid) return;
      const { data: adminRow } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', uid)
        .maybeSingle();
      setIsAdmin(Boolean(adminRow));
    };
    loadAdmin();
  }, []);

  const sections = [
    {
      title: "Obavje\u0161tenja",
      items: [
        {
          id: 'notifications',
          icon: Bell,
          label: "Push obavje\u0161tenja",
          description: "Primaj obavje\u0161tenja o novim izazovima",
          type: 'toggle' as const,
          value: settings.notifications,
          onChange: (value: boolean) => setSettings({ ...settings, notifications: value }),
        },
      ],
    },
    {
      title: "Privatnost i bezbjednost",
      items: [
        {
          id: 'privacy',
          icon: Shield,
          label: "Privatnost i dozvole",
          description: "Upravljaj pristupom aplikaciji",
          type: 'link' as const,
          onPress: () => navigation.navigate('Privacy' as never),
        },
        {
          id: 'terms',
          icon: Info,
          label: "Uslovi kori\u0161\u0107enja",
          description: "Pro\u010ditaj pravila kori\u0161\u0107enja",
          type: 'link' as const,
          onPress: () => navigation.navigate('Terms' as never),
        },
      ],
    },
    ...(isAdmin
      ? [
          {
            title: "Administracija",
            items: [
              {
                id: 'moderation',
                icon: Shield,
                label: "Moderacija prijava",
                description: "Odobri ili odbij foto i grupne prijave",
                type: 'link' as const,
                onPress: () => navigation.navigate('AdminModeration' as never),
              },
            ],
          },
        ]
      : []),
  ];

  return (
    <GradientBackground>
      <ScreenFade>
        <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{"Pode\u0161avanja"}</Text>
          <Text style={styles.subtitle}>{"Prilagodi svoju aplikaciju"}</Text>
        </View>

        <View style={styles.sections}>
          {sections.map((section) => (
            <View key={section.title} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <GlowCard contentStyle={styles.sectionContainer}>
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
              </GlowCard>
            </View>
          ))}
        </View>

        <View style={styles.appInfoCard}>
          <Text style={styles.appEmoji}>🌱</Text>
          <Text style={styles.appTitle}>{"GrowWithUs"}</Text>
          <Text style={styles.appDescription}>{"\u010cuvaj prirodu."}</Text>
          <Text style={styles.appDetail}>{"Verzija 1.0.0"}</Text>
          <Text style={styles.appDetail}>{"\u00a9 2025 GrowWithUs Nenad"}</Text>
        </View>

        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>{"Kontakt i podr\u0161ka"}</Text>
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
      </ScreenFade>
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
    borderRadius: radius.lg,
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
