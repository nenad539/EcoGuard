import React, { useEffect, useState } from 'react';
import { ScrollView, Text, StyleSheet, View, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { ArrowLeft, Edit, BarChart3, LogOut, Award, Target, Flame } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { getCached, setCached } from '../lib/cache';
import { useRealtimeStatus } from '../lib/realtime';
import { colors, radius, spacing, gradients } from '../styles/common';
import { GradientBackground } from '../components/common/GradientBackground';
import { SkeletonBlock } from '../components/common/Skeleton';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type Activity = {
  id: string;
  opis: string;
  poena_dodato: number | null;
  kategorija: string | null;
  status: string | null;
  kreirano_u: string | null;
};
const CACHE_TTL = 1000 * 60 * 5;

export function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const ACTIVITY_TABLE = 'aktivnosti';
  const realtimeConnected = useRealtimeStatus();

  const [userId, setUserId] = useState<string | null>(null);
  const [userStreak, setUserStreak] = useState('0');
  const [userCompleted, setUserCompleted] = useState('0');
  const [userPoints, setUserPoints] = useState('0');
  const [userName, setUserName] = useState('');
  const [userBadge, setUserBadge] = useState<'gold' | 'silver' | 'bronze'>('bronze');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [usingCache, setUsingCache] = useState(false);

  const getUserId = async (): Promise<string | undefined> => {
    if (userId) return userId;
    const { data } = await supabase.auth.getUser();
    if (data?.user?.id) {
      setUserId(data.user.id);
      return data.user.id;
    }
    const { data: idData } = await supabase.from('korisnik_profil').select('id').limit(1);
    const fallbackId = idData?.[0]?.id;
    if (fallbackId) setUserId(fallbackId);
    return fallbackId;
  };

  const updateAndGetStreak = async (): Promise<number> => {
    const userId = await getUserId();
    if (!userId) return 0;

    const today = new Date();
    const todayDate = today.toISOString().split('T')[0];

    const { data } = await supabase
      .from('korisnik_profil')
      .select('dnevna_serija, posljednji_login')
      .eq('id', userId)
      .single();

    if (!data) return 0;

    let streak = data.dnevna_serija ?? 0;

    if (!data.posljednji_login) {
      streak = 1;
    } else {
      const last = new Date(data.posljednji_login);
      const diff =
        (today.setHours(0, 0, 0, 0) - last.setHours(0, 0, 0, 0)) / 86400000;

      if (diff === 1) streak += 1;
      else if (diff > 1) streak = 1;
    }

    await supabase
      .from('korisnik_profil')
      .update({ dnevna_serija: streak, posljednji_login: todayDate })
      .eq('id', userId);

    return streak;
  };

  const loadUserData = async () => {
    const userId = await getUserId();
    if (!userId) return;
    setLoadingProfile(true);

    const { data: profile } = await supabase
      .from('korisnik_profil')
      .select('korisnicko_ime, ukupno_poena, izazova_zavrseno, trenutni_bedz')
      .eq('id', userId)
      .single();

    setUserName(profile?.korisnicko_ime ?? 'Korisnik');
    setUserPoints(String(profile?.ukupno_poena ?? 0));
    setUserCompleted(String(profile?.izazova_zavrseno ?? 0));
    if (profile?.trenutni_bedz) setUserBadge(profile.trenutni_bedz);
    if (profile) {
      setCached(`profile:${userId}`, profile);
      setUsingCache(false);
    }
    setLoadingProfile(false);
  };

  const loadActivities = async () => {
    const userId = await getUserId();
    if (!userId) return;
    setLoadingActivities(true);

    const { data } = await supabase
      .from(ACTIVITY_TABLE)
      .select('id, opis, poena_dodato, kategorija, status, kreirano_u')
      .eq('korisnik_id', userId)
      .order('kreirano_u', { ascending: false })
      .limit(10);

    setActivities((data ?? []) as Activity[]);
    setCached(`profile-activities:${userId}`, data ?? []);
    setUsingCache(false);
    setLoadingActivities(false);
  };

  useEffect(() => {
    const init = async () => {
      const streak = await updateAndGetStreak();
      setUserStreak(String(streak));
      const uid = await getUserId();
      if (uid) {
        const cachedProfile = await getCached<{
          korisnicko_ime: string | null;
          ukupno_poena: number | null;
          izazova_zavrseno: number | null;
          trenutni_bedz: 'gold' | 'silver' | 'bronze' | null;
        }>(`profile:${uid}`, CACHE_TTL);
        if (cachedProfile?.value) {
          setUserName(cachedProfile.value.korisnicko_ime ?? 'Korisnik');
          setUserPoints(String(cachedProfile.value.ukupno_poena ?? 0));
          setUserCompleted(String(cachedProfile.value.izazova_zavrseno ?? 0));
          if (cachedProfile.value.trenutni_bedz) setUserBadge(cachedProfile.value.trenutni_bedz);
          setUsingCache(cachedProfile.isStale);
          setLoadingProfile(false);
        }

        const cachedActivities = await getCached<Activity[]>(`profile-activities:${uid}`, CACHE_TTL);
        if (cachedActivities?.value?.length) {
          setActivities(cachedActivities.value);
          setUsingCache(cachedActivities.isStale);
          setLoadingActivities(false);
        }
      }
      await loadUserData();
      await loadActivities();
    };
    init();
  }, []);

  useEffect(() => {
    let channelProfile: ReturnType<typeof supabase.channel> | null = null;
    let channelActivities: ReturnType<typeof supabase.channel> | null = null;
    const setup = async () => {
      const userId = await getUserId();
      if (!userId) return;
      channelProfile = supabase
        .channel('profile-user')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'korisnik_profil', filter: `id=eq.${userId}` },
          () => loadUserData()
        )
        .subscribe();
      channelActivities = supabase
        .channel('profile-activities')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: ACTIVITY_TABLE, filter: `korisnik_id=eq.${userId}` },
          () => loadActivities()
        )
        .subscribe();
    };
    setup();

    return () => {
      if (channelProfile) supabase.removeChannel(channelProfile);
      if (channelActivities) supabase.removeChannel(channelActivities);
    };
  }, []);

  useEffect(() => {
    if (realtimeConnected) return;
    const interval = setInterval(() => {
      loadUserData();
      loadActivities();
    }, 20000);
    return () => clearInterval(interval);
  }, [realtimeConnected]);

  const points = Number(userPoints || 0);

  const levelLabelFromPoints = (pts: number) => {
    if (pts >= 5000) return 'Legenda prirode';
    if (pts >= 2500) return 'Eko heroj';
    if (pts >= 1000) return 'Eko borac';
    if (pts >= 500) return 'Aktivan član';
    if (pts >= 100) return 'Početnik';
    return 'Rookie';
  };

  const achievements = [
    { title: 'Početnik', description: 'Sakupi 100 poena', unlocked: points >= 100, icon: Award },
    { title: 'Aktivan član', description: 'Sakupi 500 poena', unlocked: points >= 500, icon: Target },
    { title: 'Eko borac', description: 'Sakupi 1000 poena', unlocked: points >= 1000, icon: Flame },
    { title: 'Eko heroj', description: 'Sakupi 2500 poena', unlocked: points >= 2500, icon: Award },
    { title: 'Legenda prirode', description: 'Sakupi 5000 poena', unlocked: points >= 5000, icon: Award },
  ];

  const stats = [
    { label: 'Izazova završeno', value: userCompleted, icon: Target },
    { label: 'Dnevna serija', value: userStreak, icon: Flame },
    { label: 'Ukupno poena', value: Number(userPoints).toLocaleString(), icon: Award },
  ];

  const badgeLabel = userBadge === 'gold' ? 'Gold' : userBadge === 'silver' ? 'Silver' : 'Bronze';

  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Home')}>
            <ArrowLeft color={colors.softGreen} size={18} />
            <Text style={styles.backText}>Nazad</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.profileCardWrap}>
          <BlurView intensity={20} tint="dark" style={styles.profileCard}>
            <View style={styles.profileInfo}>
              <LinearGradient colors={gradients.primary} style={styles.avatar}>
                <Text style={styles.avatarText}>{userName[0]?.toUpperCase() || 'K'}</Text>
              </LinearGradient>
              <View style={styles.profileDetails}>
                {loadingProfile ? (
                  <SkeletonBlock width={140} height={16} />
                ) : (
                  <Text style={styles.profileName}>{userName}</Text>
                )}
                <View style={styles.badgesRow}>
                  <LinearGradient colors={gradients.primary} style={styles.badgePrimary}>
                    {loadingProfile ? (
                      <SkeletonBlock width={90} height={12} />
                    ) : (
                      <Text style={styles.badgeText}>{levelLabelFromPoints(points)}</Text>
                    )}
                  </LinearGradient>
                  <View style={styles.badgeOutline}>
                    {loadingProfile ? (
                      <SkeletonBlock width={60} height={12} />
                    ) : (
                      <Text style={styles.badgeOutlineText}>{badgeLabel}</Text>
                    )}
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.profileActions}>
              <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('EditProfile')}>
                <Edit size={16} color={colors.softGreen} />
                <Text style={styles.actionText}>Uredi profil</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Statistics')}>
                <BarChart3 size={16} color={colors.softGreen} />
                <Text style={styles.actionText}>Statistika</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tvoja statistika</Text>
          <View style={styles.statsGrid}>
            {stats.map((stat) => (
              <View key={stat.label} style={styles.statCard}>
                <LinearGradient colors={gradients.primary} style={styles.statIcon}>
                  <stat.icon size={18} color={colors.text} />
                </LinearGradient>
                {loadingProfile ? (
                  <SkeletonBlock width={60} height={12} style={{ marginTop: spacing.sm }} />
                ) : (
                  <Text style={styles.statValue}>{stat.value}</Text>
                )}
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dostignuća</Text>
          <View style={styles.achievementsGrid}>
            {achievements.map((achievement) => (
              <View
                key={achievement.title}
                style={[
                  styles.achievementCard,
                  achievement.unlocked ? styles.achievementUnlocked : styles.achievementLocked,
                ]}
              >
                <achievement.icon
                  size={28}
                  color={achievement.unlocked ? colors.primary : '#64748b'}
                  style={!achievement.unlocked ? styles.achievementIconLocked : undefined}
                />
                <Text
                  style={[
                    styles.achievementTitle,
                    achievement.unlocked ? styles.achievementTitleUnlocked : styles.achievementTitleLocked,
                  ]}
                >
                  {achievement.title}
                </Text>
                <Text
                  style={[
                    styles.achievementDesc,
                    achievement.unlocked ? styles.achievementDescUnlocked : styles.achievementDescLocked,
                  ]}
                >
                  {achievement.description}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nedavne aktivnosti</Text>
          {usingCache && <Text style={styles.cacheNote}>Prikazujem keširane podatke.</Text>}
          {loadingActivities && activities.length === 0 ? (
            <View style={styles.skeletonGroup}>
              {Array.from({ length: 3 }).map((_, index) => (
                <View key={`activity-skeleton-${index}`} style={styles.activityItem}>
                  <View style={styles.activityContent}>
                    <SkeletonBlock width="70%" height={12} />
                    <SkeletonBlock width="50%" height={10} style={{ marginTop: 8 }} />
                  </View>
                  <SkeletonBlock width={40} height={12} />
                </View>
              ))}
            </View>
          ) : activities.length === 0 ? (
            <Text style={styles.emptyText}>Još nema aktivnosti.</Text>
          ) : (
            activities.map((activity) => (
              <View key={activity.id} style={styles.activityItem}>
                <View style={styles.activityContent}>
                  <Text style={styles.activityAction}>{activity.opis}</Text>
                  <Text style={styles.activityDate}>
                    {activity.kategorija ?? 'Aktivnost'} ·{' '}
                    {activity.kreirano_u ? new Date(activity.kreirano_u).toLocaleString() : 'Nedavno'}
                  </Text>
                </View>
                <Text style={styles.activityPoints}>+{activity.poena_dodato ?? 0}</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.logoutSection}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={async () => {
              await supabase.auth.signOut();
              navigation.navigate('Login');
            }}
          >
            <LogOut size={16} color="#f87171" />
            <Text style={styles.logoutText}>Odjavi se</Text>
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
    paddingBottom: spacing.md,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  backText: {
    color: colors.softGreen,
  },
  profileCardWrap: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  profileCard: {
    padding: spacing.lg,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: colors.primary,
  },
  avatarText: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '600',
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  badgePrimary: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  badgeText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  badgeOutline: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.5)',
  },
  badgeOutlineText: {
    color: colors.softGreen,
    fontSize: 12,
    fontWeight: '500',
  },
  profileActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.5)',
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
  },
  actionText: {
    color: colors.softGreen,
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  cacheNote: {
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  statLabel: {
    color: colors.muted,
    fontSize: 12,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  achievementCard: {
    width: '48%',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  achievementUnlocked: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  achievementLocked: {
    backgroundColor: 'rgba(30, 41, 59, 0.3)',
    borderColor: 'rgba(71, 85, 105, 0.3)',
  },
  achievementIconLocked: {
    opacity: 0.3,
  },
  achievementTitle: {
    marginTop: spacing.sm,
    fontSize: 14,
    fontWeight: '500',
  },
  achievementTitleUnlocked: {
    color: colors.text,
  },
  achievementTitleLocked: {
    color: '#6b7280',
  },
  achievementDesc: {
    marginTop: spacing.xs,
    fontSize: 12,
  },
  achievementDescUnlocked: {
    color: colors.softGreen,
  },
  achievementDescLocked: {
    color: '#4b5563',
  },
  activityItem: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  activityContent: {
    flex: 1,
  },
  activityAction: {
    color: colors.text,
    fontSize: 14,
    marginBottom: spacing.xs,
  },
  activityDate: {
    color: colors.muted,
    fontSize: 12,
  },
  activityPoints: {
    color: colors.primary,
    fontWeight: '500',
  },
  skeletonGroup: {
    gap: spacing.sm,
  },
  emptyText: {
    color: colors.muted,
  },
  logoutSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.5)',
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
  },
  logoutText: {
    color: '#f87171',
    fontWeight: '500',
  },
});
