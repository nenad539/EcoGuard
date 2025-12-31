import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { getCached, setCached } from '../lib/cache';
import { useRealtimeStatus } from '../lib/realtime';
import { showError, showSuccess } from '../lib/toast';
import { colors, radius, spacing, gradients } from '../styles/common';
import { GradientBackground } from '../components/common/GradientBackground';
import { LinearGradient } from 'expo-linear-gradient';
import { SkeletonBlock } from '../components/common/Skeleton';

const COMPLETION_TABLE_CANDIDATES = [
  process.env.EXPO_PUBLIC_DAILY_COMPLETION_TABLE,
  'daily_challenge_completion',
  'dailyChallengeCompletion',
  'user_daily_challenges',
].filter(Boolean) as string[];
const CACHE_TTL = 1000 * 60 * 5;

type DailyChallenge = {
  id: number;
  title: string;
  description: string | null;
  points: number;
};

type ChallengeCompletion = {
  challenge_id: number;
  completed_at: string;
};

function getDailyChallengeIds(): number[] {
  const TOTAL_CHALLENGES = 100;
  const CHALLENGES_PER_DAY = 5;
  const GROUP_COUNT = TOTAL_CHALLENGES / CHALLENGES_PER_DAY;
  const START_DATE = new Date('2025-10-10T00:00:00Z');
  const now = new Date();

  const daysSinceStart = Math.floor(
    (now.getTime() - START_DATE.getTime()) / (1000 * 60 * 60 * 24)
  );

  const groupIndex = daysSinceStart % GROUP_COUNT;
  const startId = groupIndex * CHALLENGES_PER_DAY + 1;

  return [startId, startId + 1, startId + 2, startId + 3, startId + 4];
}

export function ChallengesScreen() {
  const realtimeConnected = useRealtimeStatus();
  const [dailyChallenges, setDailyChallenges] = useState<DailyChallenge[]>([]);
  const [completionMap, setCompletionMap] = useState<Record<number, ChallengeCompletion>>({});
  const [dailyPointsEarned, setDailyPointsEarned] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [completionTable, setCompletionTable] = useState<string | null>(null);
  const resolvingTable = useRef(false);
  const [loading, setLoading] = useState(true);
  const [completionLoadingId, setCompletionLoadingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usingCache, setUsingCache] = useState(false);

  useEffect(() => {
    const fetchDailyChallenges = async () => {
      const dateKey = new Date().toISOString().slice(0, 10);
      const cached = await getCached<DailyChallenge[]>(`daily-challenges:${dateKey}`, CACHE_TTL);
      if (cached?.value?.length) {
        setDailyChallenges(cached.value);
        setUsingCache(cached.isStale);
        setLoading(false);
      }
      const ids = getDailyChallengeIds();
      const { data, error: fetchError } = await supabase
        .from('dailyChallenge')
        .select('id, title, description, points')
        .in('id', ids)
        .order('id', { ascending: true });

      if (fetchError) {
        console.error('Error fetching daily challenges:', fetchError);
        setError('Greška prilikom učitavanja izazova.');
        setDailyChallenges([]);
      } else {
        setDailyChallenges(data ?? []);
        setCached(`daily-challenges:${dateKey}`, data ?? []);
        setUsingCache(false);
      }
      setLoading(false);
    };

    fetchDailyChallenges();
  }, []);

  useEffect(() => {
    let mounted = true;

    const fetchUserId = async () => {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.warn('auth.getUser error (challenges):', authError.message || authError);
      }
      const currentUserId = authData?.user?.id;
      if (mounted && currentUserId) {
        setUserId(currentUserId);
        return;
      }

      const { data: idData, error: idError } = await supabase
        .from('korisnik_profil')
        .select('id')
        .limit(1);
      if (!idError && idData?.[0]?.id && mounted) {
        setUserId(idData[0].id);
      }
    };

    fetchUserId();

    return () => {
      mounted = false;
    };
  }, []);

  const fetchCompletions = async () => {
    if (!userId || dailyChallenges.length === 0) return;
    let tableToUse = completionTable;

    if (!tableToUse && !resolvingTable.current) {
      resolvingTable.current = true;
      for (const candidate of COMPLETION_TABLE_CANDIDATES) {
        const { error: candidateError } = await supabase
          .from(candidate)
          .select('challenge_id')
          .limit(1);

        if (candidateError?.code === 'PGRST205') {
          continue;
        }
        tableToUse = candidate;
        setCompletionTable(candidate);
        break;
      }
      resolvingTable.current = false;
    }

    if (!tableToUse) {
      setError('Nije pronađena tabela za završene izazove.');
      return;
    }

    const challengeIds = dailyChallenges.map((challenge) => challenge.id);
    const { data, error: fetchError } = await supabase
      .from(tableToUse)
      .select('challenge_id, completed_at')
      .eq('user_id', userId)
      .in('challenge_id', challengeIds);

    if (fetchError) {
      console.error('Error fetching completions:', fetchError);
      setError('Greška prilikom učitavanja završetaka.');
    } else if (data) {
      const mapped = data.reduce<Record<number, ChallengeCompletion>>((acc, item) => {
        acc[item.challenge_id] = item;
        return acc;
      }, {});
      setCompletionMap(mapped);
      const dateKey = new Date().toISOString().slice(0, 10);
      setCached(`daily-completions:${userId}:${dateKey}`, mapped);
      setUsingCache(false);
    }
  };

  useEffect(() => {
    fetchCompletions();
  }, [userId, dailyChallenges, completionTable]);

  useEffect(() => {
    const loadCompletionCache = async () => {
      if (!userId) return;
      const dateKey = new Date().toISOString().slice(0, 10);
      const cached = await getCached<Record<number, ChallengeCompletion>>(
        `daily-completions:${userId}:${dateKey}`,
        CACHE_TTL
      );
      if (cached?.value) {
        setCompletionMap(cached.value);
        setUsingCache(cached.isStale);
      }
    };
    loadCompletionCache();
  }, [userId, dailyChallenges.length]);

  useEffect(() => {
    if (!userId || !completionTable) return;
    const channel = supabase
      .channel('daily-completions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: completionTable,
          filter: `user_id=eq.${userId}`,
        },
        () => fetchCompletions()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, completionTable, dailyChallenges]);

  useEffect(() => {
    if (realtimeConnected) return;
    const interval = setInterval(() => {
      fetchCompletions();
    }, 20000);
    return () => clearInterval(interval);
  }, [userId, dailyChallenges, completionTable, realtimeConnected]);

  const awardPoints = async (points: number) => {
    if (!userId) return;
    const { error: rpcError } = await supabase.rpc('add_points', { uid: userId, pts: points });
    if (!rpcError) return;

    const { data: profile, error: fetchError } = await supabase
      .from('korisnik_profil')
      .select('ukupno_poena')
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error('Failed to read points:', fetchError);
      return;
    }

    const currentPoints = profile?.ukupno_poena ?? 0;
    const { error: updateError } = await supabase
      .from('korisnik_profil')
      .update({ ukupno_poena: currentPoints + points })
      .eq('id', userId);

    if (updateError) {
      console.error('Fallback points update failed:', updateError);
    }
  };

  const handleCompleteChallenge = async (challengeId: number, points: number) => {
    if (!userId) {
      setError('Morate biti prijavljeni da biste završili izazov.');
      showError('Greška', 'Morate biti prijavljeni.');
      return;
    }
    if (!completionTable) {
      setError('Nije pronađena tabela za završene izazove.');
      showError('Greška', 'Tabela za završene izazove nije pronađena.');
      return;
    }

    setCompletionLoadingId(challengeId);
    setError(null);

    const payload = {
      user_id: userId,
      challenge_id: challengeId,
      completed_at: new Date().toISOString(),
    };

    const { error: saveError } = await supabase
      .from(completionTable)
      .upsert(payload, { onConflict: 'user_id,challenge_id' });

    if (saveError) {
      console.error('Error saving completion:', saveError);
      setError('Greška prilikom čuvanja završetka izazova.');
      showError('Greška', 'Ne možemo sačuvati završetak.');
    } else {
      setCompletionMap((prev) => ({
        ...prev,
        [challengeId]: { challenge_id: challengeId, completed_at: payload.completed_at },
      }));
      await awardPoints(points);
      showSuccess('Uspjeh', 'Izazov je završen.');
    }

    setCompletionLoadingId(null);
  };

  useEffect(() => {
    const today = new Date();
    const isSameDay = (dateStr: string) => {
      const d = new Date(dateStr);
      return (
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate()
      );
    };

    const pointsById = dailyChallenges.reduce<Record<number, number>>((acc, challenge) => {
      acc[challenge.id] = challenge.points;
      return acc;
    }, {});

    const earned = Object.values(completionMap).reduce((sum, completion) => {
      if (completion?.completed_at && isSameDay(completion.completed_at)) {
        return sum + (pointsById[completion.challenge_id] ?? 0);
      }
      return sum;
    }, 0);

    setDailyPointsEarned(earned);
  }, [completionMap, dailyChallenges]);

  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Dnevni izazovi</Text>
        {usingCache && <Text style={styles.cacheNote}>Prikazujem keširane podatke.</Text>}
        {error && <Text style={styles.error}>{error}</Text>}

        {loading && dailyChallenges.length === 0 ? (
          <View style={styles.skeletonGroup}>
            {Array.from({ length: 4 }).map((_, index) => (
              <View key={`daily-skeleton-${index}`} style={styles.card}>
                <SkeletonBlock width="60%" height={14} />
                <SkeletonBlock width="90%" height={10} style={{ marginTop: 8 }} />
                <SkeletonBlock width="40%" height={12} style={{ marginTop: 12 }} />
              </View>
            ))}
          </View>
        ) : null}

        {dailyChallenges.map((challenge) => {
          const isCompleted = Boolean(completionMap[challenge.id]);
          return (
            <View key={challenge.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{challenge.title}</Text>
                {isCompleted && <CheckCircle2 color={colors.primary} size={18} />}
              </View>
              {challenge.description ? (
                <Text style={styles.cardDescription}>{challenge.description}</Text>
              ) : null}
              <Text style={styles.points}>+{challenge.points} poena</Text>
              <TouchableOpacity
                style={[styles.actionButton, isCompleted && styles.actionDisabled]}
                onPress={() => handleCompleteChallenge(challenge.id, challenge.points)}
                disabled={isCompleted || completionLoadingId === challenge.id}
              >
                <LinearGradient colors={gradients.primary} style={styles.actionInner}>
                  <Text style={styles.actionLabel}>
                    {isCompleted
                      ? 'Završen'
                      : completionLoadingId === challenge.id
                      ? 'Čuvanje...'
                      : 'Završi'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          );
        })}

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Poeni danas</Text>
          <Text style={styles.summaryValue}>{dailyPointsEarned}</Text>
        </View>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  cacheNote: {
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  error: {
    color: colors.danger,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    color: colors.text,
    fontWeight: '600',
  },
  cardDescription: {
    color: colors.muted,
    marginTop: spacing.xs,
  },
  points: {
    color: colors.primary,
    marginTop: spacing.sm,
    fontWeight: '500',
  },
  actionButton: {
    marginTop: spacing.sm,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  actionInner: {
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  actionDisabled: {
    backgroundColor: '#1f2937',
  },
  actionLabel: {
    color: colors.text,
    fontWeight: '600',
  },
  summaryCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.cardAlt,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryTitle: {
    color: colors.muted,
  },
  summaryValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  skeletonGroup: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
});
