import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, StyleSheet, View, TouchableOpacity } from 'react-native';
import { TrendingUp, Award, Target, Recycle, Droplet, Battery, Flame } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { getCached, setCached } from '../lib/cache';
import { useRealtimeStatus } from '../lib/realtime';
import { colors, radius, spacing, gradients } from '../styles/common';
import { GradientBackground } from '../components/common/GradientBackground';
import { LinearGradient } from 'expo-linear-gradient';
import { SkeletonBlock } from '../components/common/Skeleton';
import { ScreenFade } from '../components/common/ScreenFade';

const CACHE_TTL = 1000 * 60 * 5;

export function StatisticsScreen() {
  const realtimeConnected = useRealtimeStatus();
  const [timeFilter, setTimeFilter] = useState<'day' | 'week' | 'month'>('week');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingCache, setUsingCache] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [recikliranoStvari, setRecikliranoStvari] = useState<number | null>(null);
  const [ustedjenaEnergija, setUstedjenaEnergija] = useState<number | null>(null);
  const [smanjenCo2, setSmanjenCo2] = useState<number | null>(null);
  const [izazovaZavrseno, setIzazovaZavrseno] = useState<number | null>(null);
  const [dnevnaSerija, setDnevnaSerija] = useState<number | null>(null);
  const [ukupnoPoena, setUkupnoPoena] = useState<number | null>(null);
  const [rank, setRank] = useState<number | null>(null);

  const getUserId = async (): Promise<string | undefined> => {
    if (userId) return userId;
    const { data: authData } = await supabase.auth.getUser();
    if (authData?.user?.id) {
      setUserId(authData.user.id);
      return authData.user.id;
    }

    const { data } = await supabase.from('korisnik_profil').select('id').limit(1);
    const fallbackId = data?.[0]?.id;
    if (fallbackId) setUserId(fallbackId);
    return fallbackId;
  };

  const refreshStats = async () => {
    const userId = await getUserId();
    if (!userId) return;

    const { data: profile, error: profileError } = await supabase
      .from('korisnik_profil')
      .select(
        'reciklirano_stvari, ustedjena_energija, smanjen_co2, izazova_zavrseno, dnevna_serija, ukupno_poena'
      )
      .eq('id', userId)
      .single();

    if (profileError) {
      setError(profileError.message);
      return;
    }

    setRecikliranoStvari(profile?.reciklirano_stvari ?? null);
    setUstedjenaEnergija(profile?.ustedjena_energija ?? null);
    setSmanjenCo2(profile?.smanjen_co2 ?? null);
    setIzazovaZavrseno(profile?.izazova_zavrseno ?? null);
    setDnevnaSerija(profile?.dnevna_serija ?? null);
    setUkupnoPoena(profile?.ukupno_poena ?? null);

    const { data: leaderboard } = await supabase
      .from('korisnik_profil')
      .select('id, ukupno_poena')
      .order('ukupno_poena', { ascending: false })
      .limit(100);

    const idx = leaderboard?.findIndex((row) => row.id === userId);
    if (idx != null && idx >= 0) setRank(idx + 1);

    setCached(`stats:${userId}`, {
      reciklirano_stvari: profile?.reciklirano_stvari ?? null,
      ustedjena_energija: profile?.ustedjena_energija ?? null,
      smanjen_co2: profile?.smanjen_co2 ?? null,
      izazova_zavrseno: profile?.izazova_zavrseno ?? null,
      dnevna_serija: profile?.dnevna_serija ?? null,
      ukupno_poena: profile?.ukupno_poena ?? null,
      rank: idx != null && idx >= 0 ? idx + 1 : null,
    });
    setUsingCache(false);
  };

  useEffect(() => {
    let mounted = true;
    const loadStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const uid = await getUserId();
        if (uid) {
          const cached = await getCached<{
            reciklirano_stvari: number | null;
            ustedjena_energija: number | null;
            smanjen_co2: number | null;
            izazova_zavrseno: number | null;
            dnevna_serija: number | null;
            ukupno_poena: number | null;
            rank: number | null;
          }>(`stats:${uid}`, CACHE_TTL);
          if (cached?.value) {
            setRecikliranoStvari(cached.value.reciklirano_stvari);
            setUstedjenaEnergija(cached.value.ustedjena_energija);
            setSmanjenCo2(cached.value.smanjen_co2);
            setIzazovaZavrseno(cached.value.izazova_zavrseno);
            setDnevnaSerija(cached.value.dnevna_serija);
            setUkupnoPoena(cached.value.ukupno_poena);
            setRank(cached.value.rank);
            setUsingCache(cached.isStale);
            setLoading(false);
          }
        }
        await refreshStats();
      } catch (err) {
        console.error(err);
        setError('Greška prilikom učitavanja statistike.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadStats();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    const setup = async () => {
      const userId = await getUserId();
      if (!userId) return;
      channel = supabase
        .channel('stats-profile')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'korisnik_profil', filter: `id=eq.${userId}` },
          () => refreshStats()
        )
        .subscribe();
    };
    setup();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (realtimeConnected) return;
    const interval = setInterval(() => {
      refreshStats();
    }, 30000);
    return () => clearInterval(interval);
  }, [realtimeConnected]);

  const pointsData = useMemo(() => {
    if (timeFilter === 'day') return [30, 45, 60, 40];
    if (timeFilter === 'month') return [450, 520, 480, 600];
    return [120, 150, 90, 180, 140, 200, 160];
  }, [timeFilter]);

  const recyclingData = useMemo(() => {
    if (timeFilter === 'day') return [1.2, 2.5, 1.8];
    if (timeFilter === 'month') return [5.2, 6.8, 7.5, 9.1];
    return [5.2, 6.8, 7.5, 9.1];
  }, [timeFilter]);

  const maxPoints = Math.max(...pointsData);
  const maxRecycle = Math.max(...recyclingData);

  return (
    <GradientBackground>
      <ScreenFade>
        <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Statistika</Text>
          <Text style={styles.subtitle}>Pratite svoj napredak</Text>
        </View>

        <View style={styles.filterRow}>
          {(['day', 'week', 'month'] as const).map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterTab, timeFilter === filter && styles.filterTabActive]}
              onPress={() => setTimeFilter(filter)}
            >
              <Text style={[styles.filterText, timeFilter === filter && styles.filterTextActive]}>
                {filter === 'day' ? 'Dan' : filter === 'week' ? 'Sedmica' : 'Mjesec'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {usingCache && <Text style={styles.cacheNote}>Prikazujem keširane podatke.</Text>}
        {loading && <Text style={styles.muted}>Učitavanje...</Text>}
        {error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <LinearGradient colors={gradients.primary} style={styles.summaryIcon}>
              <Award size={18} color={colors.text} />
            </LinearGradient>
            <Text style={styles.summaryLabel}>Ukupno poena</Text>
            {loading && ukupnoPoena == null ? (
              <SkeletonBlock width={60} height={14} />
            ) : (
              <Text style={styles.summaryValue}>{ukupnoPoena ?? 0}</Text>
            )}
          </View>
          <View style={styles.summaryCard}>
            <LinearGradient colors={gradients.primary} style={styles.summaryIcon}>
              <Target size={18} color={colors.text} />
            </LinearGradient>
            <Text style={styles.summaryLabel}>Izazova završeno</Text>
            {loading && izazovaZavrseno == null ? (
              <SkeletonBlock width={60} height={14} />
            ) : (
              <Text style={styles.summaryValue}>{izazovaZavrseno ?? 0}</Text>
            )}
          </View>
        </View>

        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <LinearGradient colors={gradients.primary} style={styles.summaryIcon}>
              <TrendingUp size={18} color={colors.text} />
            </LinearGradient>
            <Text style={styles.summaryLabel}>Rang</Text>
            {loading && rank == null ? (
              <SkeletonBlock width={40} height={14} />
            ) : (
              <Text style={styles.summaryValue}>{rank ?? '-'}</Text>
            )}
          </View>
          <View style={styles.summaryCard}>
            <LinearGradient colors={gradients.primary} style={styles.summaryIcon}>
              <Flame size={18} color={colors.text} />
            </LinearGradient>
            <Text style={styles.summaryLabel}>Dnevna serija</Text>
            {loading && dnevnaSerija == null ? (
              <SkeletonBlock width={40} height={14} />
            ) : (
              <Text style={styles.summaryValue}>{dnevnaSerija ?? 0}</Text>
            )}
          </View>
        </View>

        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Poeni kroz vrijeme</Text>
            <Text style={styles.chartSubtitle}>
              {timeFilter === 'day' ? 'Danas' : timeFilter === 'week' ? 'Sedmica' : 'Mjesec'}
            </Text>
          </View>
          <View style={styles.barRow}>
            {pointsData.map((value, idx) => (
              <View key={`p-${idx}`} style={styles.barWrapper}>
                <View style={[styles.bar, { height: `${(value / maxPoints) * 100}%` }]} />
              </View>
            ))}
          </View>
        </View>

        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Reciklaža (kg)</Text>
            <Text style={styles.chartSubtitle}>Aktivnost</Text>
          </View>
          <View style={styles.barRow}>
            {recyclingData.map((value, idx) => (
              <View key={`r-${idx}`} style={styles.barWrapper}>
                <View style={[styles.barAlt, { height: `${(value / maxRecycle) * 100}%` }]} />
              </View>
            ))}
          </View>
        </View>

        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Recycle size={18} color={colors.primary} />
            <Text style={styles.metricLabel}>Reciklirano</Text>
            <Text style={styles.metricValue}>{recikliranoStvari ?? 0}</Text>
          </View>
          <View style={styles.metricCard}>
            <Battery size={18} color={colors.primary} />
            <Text style={styles.metricLabel}>Energija</Text>
            <Text style={styles.metricValue}>{ustedjenaEnergija ?? 0}</Text>
          </View>
          <View style={styles.metricCard}>
            <Droplet size={18} color={colors.primary} />
            <Text style={styles.metricLabel}>CO₂</Text>
            <Text style={styles.metricValue}>{smanjenCo2 ?? 0}</Text>
          </View>
        </View>
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
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filterTab: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
  },
  filterTabActive: {
    borderColor: 'rgba(34, 197, 94, 0.3)',
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  filterText: {
    color: colors.muted,
    fontWeight: '500',
  },
  filterTextActive: {
    color: colors.softGreen,
  },
  muted: {
    color: colors.muted,
  },
  error: {
    color: colors.danger,
    marginBottom: spacing.sm,
  },
  cacheNote: {
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  summaryIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    color: colors.muted,
    fontSize: 12,
  },
  summaryValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  chartCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  chartHeader: {
    marginBottom: spacing.sm,
  },
  chartTitle: {
    color: colors.text,
    fontWeight: '600',
  },
  chartSubtitle: {
    color: colors.muted,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    height: 120,
  },
  barWrapper: {
    flex: 1,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: radius.sm,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bar: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
  },
  barAlt: {
    backgroundColor: '#38bdf8',
    borderRadius: radius.sm,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 12,
  },
  metricValue: {
    color: colors.text,
    fontWeight: '600',
  },
});
