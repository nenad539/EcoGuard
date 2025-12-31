import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Bell, Users, Star, Flame, Medal } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { supabase } from '../lib/supabase';
import { getCached, setCached } from '../lib/cache';
import { useRealtimeStatus } from '../lib/realtime';
import { colors, radius, spacing, gradients } from '../styles/common';
import { GradientBackground } from '../components/common/GradientBackground';
import { LinearGradient } from 'expo-linear-gradient';
import { SkeletonBlock } from '../components/common/Skeleton';
import { ScreenFade } from '../components/common/ScreenFade';

const ACTIVITY_TABLE = 'aktivnosti';
const CACHE_TTL = 1000 * 60 * 5;

type Activity = {
  id: string;
  opis: string;
  poena_dodato: number | null;
  kategorija: string | null;
  status: string | null;
  kreirano_u: string | null;
};

export function HomeScreen() {
  const realtimeConnected = useRealtimeStatus();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [userPoints, setUserPoints] = useState(0);
  const [userBadge, setUserBadge] = useState<'gold' | 'silver' | 'bronze'>('bronze');
  const [userStreak, setUserStreak] = useState('0');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [usingCache, setUsingCache] = useState(false);

  const levelLabelFromPoints = (pts: number) => {
    if (pts >= 5000) return 'Legenda prirode';
    if (pts >= 2500) return 'Eko heroj';
    if (pts >= 1000) return 'Eko borac';
    if (pts >= 500) return 'Aktivan član';
    if (pts >= 100) return 'Početnik';
    return 'Rookie';
  };

  const getCurrentUserId = async () => {
    if (userId) return userId;
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Auth error:', error);
      return null;
    }
    const uid = data.user?.id ?? null;
    setUserId(uid);
    return uid;
  };

  const updateAndGetStreak = async () => {
    const userId = await getCurrentUserId();
    if (!userId) return 0;

    const today = new Date();
    const todayDate = today.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('korisnik_profil')
      .select('dnevna_serija, posljednji_login')
      .eq('id', userId)
      .single();

    if (error || !data) {
      console.error('Streak fetch error:', error);
      return 0;
    }

    let newStreak = data.dnevna_serija ?? 0;

    if (!data.posljednji_login) {
      newStreak = 1;
    } else {
      const lastLogin = new Date(data.posljednji_login);
      const diffDays =
        (today.setHours(0, 0, 0, 0) - lastLogin.setHours(0, 0, 0, 0)) / 86400000;

      if (diffDays === 1) newStreak += 1;
      else if (diffDays > 1) newStreak = 1;
    }

    await supabase
      .from('korisnik_profil')
      .update({
        dnevna_serija: newStreak,
        posljednji_login: todayDate,
      })
      .eq('id', userId);

    return newStreak;
  };

  const syncBadgeFromLeaderboard = async (
    uid: string,
    currentBadge: 'gold' | 'silver' | 'bronze'
  ) => {
    const { data, error } = await supabase
      .from('korisnik_profil')
      .select('id')
      .order('ukupno_poena', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Badge sync error', error);
      return currentBadge;
    }

    const rankIndex = (data ?? []).findIndex((row) => row.id === uid);
    let nextBadge: 'gold' | 'silver' | 'bronze' = 'bronze';
    if (rankIndex >= 0 && rankIndex < 5) nextBadge = 'gold';
    else if (rankIndex >= 0 && rankIndex < 10) nextBadge = 'silver';

    if (nextBadge !== currentBadge) {
      await supabase.from('korisnik_profil').update({ trenutni_bedz: nextBadge }).eq('id', uid);
    }

    return nextBadge;
  };

  useEffect(() => {
    updateAndGetStreak().then((streak) => setUserStreak(String(streak)));
  }, []);

  const loadProfile = async () => {
    const uid = await getCurrentUserId();
    if (!uid) return;
    setLoadingProfile(true);

    const { data, error } = await supabase
      .from('korisnik_profil')
      .select('korisnicko_ime, ukupno_poena, trenutni_bedz')
      .eq('id', uid)
      .single();

    if (error || !data) {
      console.error('Profile error', error);
      setLoadingProfile(false);
      return;
    }

    setUserName(data.korisnicko_ime ?? 'Korisnik');
    setUserPoints(data.ukupno_poena ?? 0);
    const profileBadge = (data.trenutni_bedz as 'gold' | 'silver' | 'bronze' | null) ?? 'bronze';
    const nextBadge = await syncBadgeFromLeaderboard(uid, profileBadge);
    setUserBadge(nextBadge);
    setCached(`home-profile:${uid}`, {
      korisnicko_ime: data.korisnicko_ime ?? 'Korisnik',
      ukupno_poena: data.ukupno_poena ?? 0,
      trenutni_bedz: nextBadge,
    });
    setUsingCache(false);
    setLoadingProfile(false);
  };

  const loadActivities = async () => {
    const uid = await getCurrentUserId();
    if (!uid) return;
    setLoadingActivities(true);

    const { data, error } = await supabase
      .from(ACTIVITY_TABLE)
      .select('id, opis, poena_dodato, kategorija, status, kreirano_u')
      .eq('korisnik_id', uid)
      .order('kreirano_u', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Activity error', error);
      setLoadingActivities(false);
      return;
    }

    setActivities(data ?? []);
    setCached(`home-activities:${uid}`, data ?? []);
    setUsingCache(false);
    setLoadingActivities(false);
  };

  useEffect(() => {
    const init = async () => {
      const uid = await getCurrentUserId();
      if (!uid) return;
      const cachedProfile = await getCached<{
        korisnicko_ime: string;
        ukupno_poena: number;
        trenutni_bedz: 'gold' | 'silver' | 'bronze';
      }>(`home-profile:${uid}`, CACHE_TTL);
      if (cachedProfile?.value) {
        setUserName(cachedProfile.value.korisnicko_ime);
        setUserPoints(cachedProfile.value.ukupno_poena);
        setUserBadge(cachedProfile.value.trenutni_bedz);
        setUsingCache(cachedProfile.isStale);
        setLoadingProfile(false);
      }
      const cachedActivities = await getCached<Activity[]>(`home-activities:${uid}`, CACHE_TTL);
      if (cachedActivities?.value?.length) {
        setActivities(cachedActivities.value);
        setUsingCache(cachedActivities.isStale);
        setLoadingActivities(false);
      }
      loadProfile();
      loadActivities();
    };
    init();
  }, []);

  useEffect(() => {
    let channelProfile: ReturnType<typeof supabase.channel> | null = null;
    let channelActivities: ReturnType<typeof supabase.channel> | null = null;
    const setup = async () => {
      const userId = await getCurrentUserId();
      if (!userId) return;
      channelProfile = supabase
        .channel('home-profile')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'korisnik_profil', filter: `id=eq.${userId}` },
          () => loadProfile()
        )
        .subscribe();
      channelActivities = supabase
        .channel('home-activities')
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
      loadProfile();
      loadActivities();
    }, 15000);
    return () => clearInterval(interval);
  }, [realtimeConnected]);

  const badgeLabel = userBadge === 'gold' ? 'Gold' : userBadge === 'silver' ? 'Silver' : 'Bronze';
  const badgeColor = userBadge === 'gold' ? colors.gold : userBadge === 'silver' ? colors.silver : colors.bronze;

  return (
    <GradientBackground>
      <ScreenFade>
        <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View>
          {loadingProfile ? (
            <SkeletonBlock width={180} height={16} />
          ) : (
            <Text style={styles.welcome}>Dobro došao nazad, {userName}</Text>
          )}
          {loadingProfile ? (
            <SkeletonBlock width={140} height={12} style={{ marginTop: spacing.xs }} />
          ) : (
            <Text style={styles.subTitle}>{levelLabelFromPoints(userPoints)}</Text>
          )}
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Notifications')}>
            <Bell color={colors.primary} size={20} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Friends')}>
            <Users color={colors.primary} size={20} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statGrid}>
        <View style={[styles.statCard, { borderColor: badgeColor }]}>
          <Medal color={badgeColor} size={26} />
          <Text style={styles.statLabel}>Bedž</Text>
          {loadingProfile ? <SkeletonBlock width={60} height={14} /> : <Text style={styles.statValue}>{badgeLabel}</Text>}
        </View>
        <View style={styles.statCard}>
          <Star color={colors.primary} size={26} />
          <Text style={styles.statLabel}>Ukupni poeni</Text>
          {loadingProfile ? <SkeletonBlock width={70} height={14} /> : <Text style={styles.statValue}>{userPoints}</Text>}
        </View>
      </View>

      <View style={styles.streakCard}>
        <View style={styles.streakRow}>
          <Flame color={colors.primary} size={24} />
          <View>
            <Text style={styles.statLabel}>Dnevna serija</Text>
            <Text style={styles.streakValue}>{userStreak} dana</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity onPress={() => navigation.navigate('Challenges')}>
        <LinearGradient colors={gradients.primary} style={styles.cta}>
          <Star color={colors.text} size={18} />
          <Text style={styles.ctaText}>Dnevni Izazovi</Text>
        </LinearGradient>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Nedavne aktivnosti</Text>
        {usingCache && <Text style={styles.cacheNote}>Prikazujem keširane podatke.</Text>}
        {loadingActivities && activities.length === 0 ? (
          <View style={styles.skeletonGroup}>
            {Array.from({ length: 3 }).map((_, index) => (
              <View key={`activity-skeleton-${index}`} style={styles.activityItem}>
                <View style={styles.activityContent}>
                  <SkeletonBlock width="70%" height={12} />
                  <SkeletonBlock width="40%" height={10} style={{ marginTop: 8 }} />
                </View>
                <SkeletonBlock width={40} height={12} />
              </View>
            ))}
          </View>
        ) : activities.length === 0 ? (
          <Text style={styles.empty}>Još nema aktivnosti.</Text>
        ) : (
          activities.map((activity) => (
            <View key={activity.id} style={styles.activityItem}>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>{activity.opis}</Text>
                <Text style={styles.activityTime}>
                  {activity.kreirano_u ? new Date(activity.kreirano_u).toLocaleString() : 'Nedavno'}
                </Text>
              </View>
              <View style={styles.activityPointsWrap}>
                <Text style={styles.activityPoints}>
                  {activity.status === 'pending'
                    ? 'Na čekanju'
                    : activity.poena_dodato != null
                    ? `+${activity.poena_dodato}`
                    : '+0'}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Brze akcije</Text>
        <View style={styles.quickRow}>
          <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('EcoTips')}>
            <Text style={styles.quickTitle}>Eko savjeti</Text>
            <Text style={styles.quickSubtitle}>Saznaj više</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('Community')}>
            <Text style={styles.quickTitle}>Zajednica</Text>
            <Text style={styles.quickSubtitle}>Rang lista</Text>
          </TouchableOpacity>
        </View>
      </View>
        </ScrollView>
      </ScreenFade>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  welcome: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '600',
  },
  subTitle: {
    color: colors.muted,
    marginTop: spacing.xs,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconButton: {
    backgroundColor: colors.card,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statLabel: {
    color: colors.muted,
    marginTop: spacing.xs,
  },
  statValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  streakCard: {
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  streakValue: {
    color: colors.text,
    fontWeight: '600',
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
  },
  ctaText: {
    color: colors.text,
    fontWeight: '600',
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  empty: {
    color: colors.muted,
  },
  cacheNote: {
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  activityContent: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  activityTitle: {
    color: colors.text,
    fontWeight: '500',
  },
  activityTime: {
    color: colors.muted,
    marginTop: spacing.xs,
    fontSize: 12,
  },
  activityPointsWrap: {
    minWidth: 90,
    alignItems: 'flex-end',
  },
  activityPoints: {
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'right',
  },
  skeletonGroup: {
    gap: spacing.sm,
  },
  quickRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  quickAction: {
    flex: 1,
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickTitle: {
    color: colors.text,
    fontWeight: '600',
  },
  quickSubtitle: {
    color: colors.muted,
    marginTop: spacing.xs,
  },
});
