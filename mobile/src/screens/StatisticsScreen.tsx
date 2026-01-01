import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, StyleSheet, View, TouchableOpacity } from 'react-native';
import { TrendingUp, Award, Target, Flame, Camera, Users } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { getCached, setCached } from '../lib/cache';
import { useRealtimeStatus } from '../lib/realtime';
import { colors, radius, spacing, gradients } from '../styles/common';
import { GradientBackground } from '../components/common/GradientBackground';
import { LinearGradient } from 'expo-linear-gradient';
import { SkeletonBlock } from '../components/common/Skeleton';
import { ScreenFade } from '../components/common/ScreenFade';
import { GlowCard } from '../components/common/GlowCard';
import { trackEvent } from '../lib/analytics';
import { triggerHaptic } from '../lib/haptics';
import { useLanguage } from '../lib/language';

const CACHE_TTL = 1000 * 60 * 5;
const ACTIVITY_TABLE = 'aktivnosti';
const COMPLETION_STATUSES = new Set(['completed', 'approved']);

type TimeFilter = 'day' | 'week' | 'month';

type ActivityRow = {
  poena_dodato: number | null;
  kategorija: string | null;
  status: string | null;
  kreirano_u: string | null;
};

type TypeTotals = Record<string, { count: number; points: number }>;

export function StatisticsScreen() {
  const realtimeConnected = useRealtimeStatus();
  const { t } = useLanguage();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('week');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [activityLoading, setActivityLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingCache, setUsingCache] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [izazovaZavrseno, setIzazovaZavrseno] = useState<number | null>(null);
  const [dnevnaSerija, setDnevnaSerija] = useState<number | null>(null);
  const [ukupnoPoena, setUkupnoPoena] = useState<number | null>(null);
  const [rank, setRank] = useState<number | null>(null);
  const [periodPoints, setPeriodPoints] = useState(0);
  const [periodCompletions, setPeriodCompletions] = useState(0);
  const [pointsSeries, setPointsSeries] = useState<number[]>([]);
  const [pointsLabels, setPointsLabels] = useState<string[]>([]);
  const [completionSeries, setCompletionSeries] = useState<number[]>([]);
  const [completionLabels, setCompletionLabels] = useState<string[]>([]);
  const [typeTotals, setTypeTotals] = useState<TypeTotals>({});

  const timeFilterLabel =
    timeFilter === 'day' ? t('statsFilterDay') : timeFilter === 'week' ? t('statsFilterWeek') : t('statsFilterMonth');

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

  const buildBuckets = (filter: TimeFilter) => {
    const now = new Date();
    const buckets: { label: string; start: Date; end: Date }[] = [];

    if (filter === 'day') {
      const end = new Date(now);
      end.setMinutes(0, 0, 0);
      const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
      for (let i = 0; i < 6; i += 1) {
        const bucketStart = new Date(start.getTime() + i * 4 * 60 * 60 * 1000);
        const bucketEnd = new Date(bucketStart.getTime() + 4 * 60 * 60 * 1000);
        const label = `${String(bucketStart.getHours()).padStart(2, '0')}h`;
        buckets.push({
          label,
          start: bucketStart,
          end: i === 5 ? now : bucketEnd,
        });
      }
      return buckets;
    }

    if (filter === 'week') {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - 6);
      const dayLabels = [
        t('daySunShort'),
        t('dayMonShort'),
        t('dayTueShort'),
        t('dayWedShort'),
        t('dayThuShort'),
        t('dayFriShort'),
        t('daySatShort'),
      ];
      for (let i = 0; i < 7; i += 1) {
        const bucketStart = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
        const bucketEnd = new Date(bucketStart.getTime() + 24 * 60 * 60 * 1000);
        buckets.push({
          label: dayLabels[bucketStart.getDay()],
          start: bucketStart,
          end: i === 6 ? now : bucketEnd,
        });
      }
      return buckets;
    }

    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - 27);
    for (let i = 0; i < 4; i += 1) {
      const bucketStart = new Date(start.getTime() + i * 7 * 24 * 60 * 60 * 1000);
      const bucketEnd = new Date(bucketStart.getTime() + 7 * 24 * 60 * 60 * 1000);
      buckets.push({
        label: t('weekLabel').replace('{week}', String(i + 1)),
        start: bucketStart,
        end: i === 3 ? now : bucketEnd,
      });
    }
    return buckets;
  };

  const refreshSummary = async () => {
    const userId = await getUserId();
    if (!userId) return;

    const { data: profile, error: profileError } = await supabase
      .from('korisnik_profil')
      .select('izazova_zavrseno, dnevna_serija, ukupno_poena')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      setError(profileError.message);
      return;
    }
    if (!profile) {
      setIzazovaZavrseno(0);
      setDnevnaSerija(0);
      setUkupnoPoena(0);
      setRank(null);
      setUsingCache(false);
      return;
    }

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

    setCached(`stats-summary:${userId}`, {
      izazova_zavrseno: profile?.izazova_zavrseno ?? null,
      dnevna_serija: profile?.dnevna_serija ?? null,
      ukupno_poena: profile?.ukupno_poena ?? null,
      rank: idx != null && idx >= 0 ? idx + 1 : null,
    });
    setUsingCache(false);
  };

  const refreshActivityStats = async () => {
    const userId = await getUserId();
    if (!userId) return;

    const buckets = buildBuckets(timeFilter);
    const startIso = buckets[0]?.start.toISOString();
    if (!startIso) return;

    const { data: rows, error: activityError } = await supabase
      .from(ACTIVITY_TABLE)
      .select('poena_dodato, kategorija, status, kreirano_u')
      .eq('korisnik_id', userId)
      .gte('kreirano_u', startIso)
      .order('kreirano_u', { ascending: true });

    if (activityError) {
      setError(activityError.message);
      return;
    }

    const pointsByBucket = Array.from({ length: buckets.length }, () => 0);
    const completionsByBucket = Array.from({ length: buckets.length }, () => 0);
    let totalPoints = 0;
    let totalCompletions = 0;
    const totals: TypeTotals = {
      regular: { count: 0, points: 0 },
      photo: { count: 0, points: 0 },
      group: { count: 0, points: 0 },
    };

    (rows ?? []).forEach((row) => {
      const activity = row as ActivityRow;
      if (!activity.kreirano_u) return;
      const activityDate = new Date(activity.kreirano_u);
      const points = activity.poena_dodato ?? 0;
      const isCompletion = COMPLETION_STATUSES.has(activity.status ?? '');
      const bucketIndex = buckets.findIndex(
        (bucket) => activityDate >= bucket.start && activityDate < bucket.end
      );

      if (bucketIndex >= 0) {
        pointsByBucket[bucketIndex] += points;
        if (isCompletion) completionsByBucket[bucketIndex] += 1;
      }

      totalPoints += points;
      if (isCompletion) {
        totalCompletions += 1;
        const category = activity.kategorija ?? 'other';
        if (!totals[category]) totals[category] = { count: 0, points: 0 };
        totals[category].count += 1;
        totals[category].points += points;
      }
    });

    setPeriodPoints(totalPoints);
    setPeriodCompletions(totalCompletions);
    setPointsSeries(pointsByBucket);
    setPointsLabels(buckets.map((bucket) => bucket.label));
    setCompletionSeries(completionsByBucket);
    setCompletionLabels(buckets.map((bucket) => bucket.label));
    setTypeTotals(totals);

    setCached(`stats-activity:${userId}:${timeFilter}`, {
      periodPoints: totalPoints,
      periodCompletions: totalCompletions,
      pointsSeries: pointsByBucket,
      pointsLabels: buckets.map((bucket) => bucket.label),
      completionSeries: completionsByBucket,
      completionLabels: buckets.map((bucket) => bucket.label),
      typeTotals: totals,
    });
    setUsingCache(false);
  };

  useEffect(() => {
    let mounted = true;
    const loadStats = async () => {
      setSummaryLoading(true);
      setActivityLoading(true);
      setError(null);
      try {
        const uid = await getUserId();
        if (uid) {
          const cached = await getCached<{
            izazova_zavrseno: number | null;
            dnevna_serija: number | null;
            ukupno_poena: number | null;
            rank: number | null;
          }>(`stats-summary:${uid}`, CACHE_TTL);
          if (cached?.value) {
            setIzazovaZavrseno(cached.value.izazova_zavrseno);
            setDnevnaSerija(cached.value.dnevna_serija);
            setUkupnoPoena(cached.value.ukupno_poena);
            setRank(cached.value.rank);
            setUsingCache(cached.isStale);
            setSummaryLoading(false);
          }

          const cachedActivity = await getCached<{
            periodPoints: number;
            periodCompletions: number;
            pointsSeries: number[];
            pointsLabels: string[];
            completionSeries: number[];
            completionLabels: string[];
            typeTotals: TypeTotals;
          }>(`stats-activity:${uid}:${timeFilter}`, CACHE_TTL);
          if (cachedActivity?.value) {
            setPeriodPoints(cachedActivity.value.periodPoints);
            setPeriodCompletions(cachedActivity.value.periodCompletions);
            setPointsSeries(cachedActivity.value.pointsSeries);
            setPointsLabels(cachedActivity.value.pointsLabels);
            setCompletionSeries(cachedActivity.value.completionSeries);
            setCompletionLabels(cachedActivity.value.completionLabels);
            setTypeTotals(cachedActivity.value.typeTotals);
            setUsingCache(cachedActivity.isStale);
            setActivityLoading(false);
          }
        }
        await refreshSummary();
        await refreshActivityStats();
    } catch (err) {
      console.error(err);
      setError(t('statsLoadError'));
    } finally {
        if (mounted) {
          setSummaryLoading(false);
          setActivityLoading(false);
        }
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
          () => {
            setSummaryLoading(true);
            refreshSummary().finally(() => setSummaryLoading(false));
          }
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
      refreshSummary();
      refreshActivityStats();
    }, 30000);
    return () => clearInterval(interval);
  }, [realtimeConnected, timeFilter]);

  useEffect(() => {
    const updateActivity = async () => {
      setActivityLoading(true);
      setError(null);
      try {
        const uid = await getUserId();
        if (uid) {
          const cachedActivity = await getCached<{
            periodPoints: number;
            periodCompletions: number;
            pointsSeries: number[];
            pointsLabels: string[];
            completionSeries: number[];
            completionLabels: string[];
            typeTotals: TypeTotals;
          }>(`stats-activity:${uid}:${timeFilter}`, CACHE_TTL);
          if (cachedActivity?.value) {
            setPeriodPoints(cachedActivity.value.periodPoints);
            setPeriodCompletions(cachedActivity.value.periodCompletions);
            setPointsSeries(cachedActivity.value.pointsSeries);
            setPointsLabels(cachedActivity.value.pointsLabels);
            setCompletionSeries(cachedActivity.value.completionSeries);
            setCompletionLabels(cachedActivity.value.completionLabels);
            setTypeTotals(cachedActivity.value.typeTotals);
            setUsingCache(cachedActivity.isStale);
          }
        }
        await refreshActivityStats();
    } catch (err) {
      console.error(err);
      setError(t('statsLoadError'));
    } finally {
      setActivityLoading(false);
    }
  };

    updateActivity();
  }, [timeFilter]);

  const maxPoints = Math.max(...pointsSeries, 1);
  const maxCompletions = Math.max(...completionSeries, 1);
  const breakdownItems = useMemo(() => {
    const build = (key: string, label: string, icon: typeof Target, tint: string) => ({
      key,
      label,
      icon,
      tint,
      count: typeTotals[key]?.count ?? 0,
      points: typeTotals[key]?.points ?? 0,
    });

    return [
      build('regular', t('statsBreakdownRegular'), Target, colors.primary),
      build('photo', t('statsBreakdownPhoto'), Camera, '#38bdf8'),
      build('group', t('statsBreakdownGroup'), Users, '#f59e0b'),
    ];
  }, [typeTotals, t]);

  return (
    <GradientBackground>
      <ScreenFade>
        <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('statsTitle')}</Text>
          <Text style={styles.subtitle}>{t('statsSubtitle')}</Text>
        </View>

        <View style={styles.filterRow}>
          {(['day', 'week', 'month'] as const).map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterTab, timeFilter === filter && styles.filterTabActive]}
              onPress={() => {
                void triggerHaptic('selection');
                trackEvent('stats_filter_change', { filter });
                setTimeFilter(filter);
              }}
              accessibilityRole="button"
              accessibilityLabel={`${t('statsFilterLabel')} ${
                filter === 'day' ? t('statsFilterDay') : filter === 'week' ? t('statsFilterWeek') : t('statsFilterMonth')
              }`}
            >
              <Text style={[styles.filterText, timeFilter === filter && styles.filterTextActive]}>
                {filter === 'day' ? t('statsFilterDay') : filter === 'week' ? t('statsFilterWeek') : t('statsFilterMonth')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {usingCache && <Text style={styles.cacheNote}>{"Prikazujem ke\u0161irane podatke."}</Text>}
        {(summaryLoading || activityLoading) && <Text style={styles.muted}>{"U\u010ditavanje..."}</Text>}
        {error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.summaryGrid}>
          <GlowCard style={styles.summaryCardShell} contentStyle={styles.summaryCard}>
            <LinearGradient colors={gradients.primary} style={styles.summaryIcon}>
              <Award size={18} color={colors.text} />
            </LinearGradient>
            <Text style={styles.summaryLabel}>{"Ukupno poena"}</Text>
            {summaryLoading && ukupnoPoena == null ? (
              <SkeletonBlock width={60} height={14} />
            ) : (
              <Text style={styles.summaryValue}>{ukupnoPoena ?? 0}</Text>
            )}
          </GlowCard>
          <GlowCard style={styles.summaryCardShell} contentStyle={styles.summaryCard}>
            <LinearGradient colors={gradients.primary} style={styles.summaryIcon}>
              <Target size={18} color={colors.text} />
            </LinearGradient>
            <Text style={styles.summaryLabel}>{"Izazova zavr\u0161eno"}</Text>
            {summaryLoading && izazovaZavrseno == null ? (
              <SkeletonBlock width={60} height={14} />
            ) : (
              <Text style={styles.summaryValue}>{izazovaZavrseno ?? 0}</Text>
            )}
          </GlowCard>
        </View>

        <View style={styles.summaryGrid}>
          <GlowCard style={styles.summaryCardShell} contentStyle={styles.summaryCard}>
            <LinearGradient colors={gradients.primary} style={styles.summaryIcon}>
              <TrendingUp size={18} color={colors.text} />
            </LinearGradient>
            <Text style={styles.summaryLabel}>{t('statsRankLabel')}</Text>
            {summaryLoading && rank == null ? (
              <SkeletonBlock width={40} height={14} />
            ) : (
              <Text style={styles.summaryValue}>{rank ?? '-'}</Text>
            )}
          </GlowCard>
          <GlowCard style={styles.summaryCardShell} contentStyle={styles.summaryCard}>
            <LinearGradient colors={gradients.primary} style={styles.summaryIcon}>
              <Flame size={18} color={colors.text} />
            </LinearGradient>
            <Text style={styles.summaryLabel}>{"Dnevna serija"}</Text>
            {summaryLoading && dnevnaSerija == null ? (
              <SkeletonBlock width={40} height={14} />
            ) : (
              <Text style={styles.summaryValue}>{dnevnaSerija ?? 0}</Text>
            )}
          </GlowCard>
        </View>

        <View style={styles.periodGrid}>
          <GlowCard style={styles.summaryCardShell} contentStyle={styles.summaryCard}>
            <LinearGradient colors={gradients.primary} style={styles.summaryIcon}>
              <Award size={18} color={colors.text} />
            </LinearGradient>
            <Text style={styles.summaryLabel}>{t('statsPeriodPointsLabel')}</Text>
            {activityLoading ? (
              <SkeletonBlock width={60} height={14} />
            ) : (
              <Text style={styles.summaryValue}>{periodPoints}</Text>
            )}
          </GlowCard>
          <GlowCard style={styles.summaryCardShell} contentStyle={styles.summaryCard}>
            <LinearGradient colors={gradients.primary} style={styles.summaryIcon}>
              <Target size={18} color={colors.text} />
            </LinearGradient>
            <Text style={styles.summaryLabel}>{t('statsPeriodCompletionsLabel')}</Text>
            {activityLoading ? (
              <SkeletonBlock width={60} height={14} />
            ) : (
              <Text style={styles.summaryValue}>{periodCompletions}</Text>
            )}
          </GlowCard>
        </View>

        <GlowCard style={styles.chartShell} contentStyle={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>{t('statsPointsOverTimeTitle')}</Text>
            <Text style={styles.chartSubtitle}>{timeFilterLabel}</Text>
          </View>
          <View style={styles.barRow}>
            {pointsSeries.map((value, idx) => (
              <View key={`p-${idx}`} style={styles.barColumn}>
                <View style={styles.barWrapper}>
                  <View style={[styles.bar, { height: `${(value / maxPoints) * 100}%` }]} />
                </View>
                <Text style={styles.barLabel}>{pointsLabels[idx]}</Text>
              </View>
            ))}
          </View>
        </GlowCard>

        <GlowCard style={styles.chartShell} contentStyle={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>{t('statsCompletionsTitle')}</Text>
            <Text style={styles.chartSubtitle}>{timeFilterLabel}</Text>
          </View>
          <View style={styles.barRow}>
            {completionSeries.map((value, idx) => (
              <View key={`c-${idx}`} style={styles.barColumn}>
                <View style={styles.barWrapper}>
                  <View style={[styles.barAlt, { height: `${(value / maxCompletions) * 100}%` }]} />
                </View>
                <Text style={styles.barLabel}>{completionLabels[idx]}</Text>
              </View>
            ))}
          </View>
        </GlowCard>

        <View style={styles.metricsGrid}>
          {breakdownItems.map((item) => (
            <GlowCard key={item.key} style={styles.metricCardShell} contentStyle={styles.metricCard}>
              <View style={[styles.metricIcon, { backgroundColor: item.tint }]}>
                <item.icon size={16} color={colors.text} />
              </View>
              <Text style={styles.metricLabel}>{item.label}</Text>
              {activityLoading ? (
                <SkeletonBlock width={40} height={12} />
              ) : (
                <Text style={styles.metricValue}>{item.count}</Text>
              )}
              <Text style={styles.metricSubValue}>
                {item.points} {"poena"}
              </Text>
            </GlowCard>
          ))}
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
  periodGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  summaryCardShell: {
    flex: 1,
  },
  summaryCard: {
    flex: 1,
    borderRadius: radius.md,
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
  chartShell: {
    marginBottom: spacing.md,
  },
  chartCard: {
    borderRadius: radius.lg,
    padding: spacing.md,
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
    height: 140,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  barWrapper: {
    width: '100%',
    height: 110,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: radius.sm,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barLabel: {
    color: colors.muted,
    fontSize: 11,
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
  metricCardShell: {
    flex: 1,
  },
  metricCard: {
    flex: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  metricIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 12,
  },
  metricValue: {
    color: colors.text,
    fontWeight: '600',
  },
  metricSubValue: {
    color: colors.muted,
    fontSize: 11,
  },
});
