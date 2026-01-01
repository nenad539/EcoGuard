import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import {
  Camera,
  CheckCircle2,
  AlertTriangle,
  Recycle,
  TreePine,
  Droplet,
  Plus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../lib/supabase';
import { getCached, setCached } from '../lib/cache';
import { useRealtimeStatus } from '../lib/realtime';
import { uploadPhotoChallenge } from '../lib/uploads';
import { showError, showInfo, showSuccess } from '../lib/toast';
import { trackEvent } from '../lib/analytics';
import { triggerHaptic } from '../lib/haptics';
import { colors, radius, spacing, gradients } from '../styles/common';
import { GradientBackground } from '../components/common/GradientBackground';
import { LinearGradient } from 'expo-linear-gradient';
import { PhotoSubmission } from '../components/PhotoSubmission';
import { SkeletonBlock } from '../components/common/Skeleton';
import { ScreenFade } from '../components/common/ScreenFade';
import { RootStackParamList } from '../navigation/types';
import { GlowCard } from '../components/common/GlowCard';

const REGULAR_COMPLETION_TABLE_CANDIDATES = [
  process.env.EXPO_PUBLIC_REGULAR_COMPLETION_TABLE,
  'regular_challenge_completions',
  'regularChallengeCompletion',
  'user_regular_challenges',
].filter(Boolean) as string[];

const REGULAR_CHALLENGE_TABLE_CANDIDATES = [
  process.env.EXPO_PUBLIC_REGULAR_CHALLENGE_TABLE,
  'regular_challenges',
  'regularChallenges',
  'regularChallenge',
].filter(Boolean) as string[];

const PHOTO_COMPLETION_TABLE = 'photo_challenge_completions';
const PHOTO_COMPLETION_ID_FIELD = 'photo_challenge_id';
const ACTIVITY_TABLE = 'aktivnosti';
const CACHE_TTL = 1000 * 60 * 5;
const PHOTO_PAGE_SIZE = 10;

const iconMap: Record<string, any> = {
  recycle: Recycle,
  tree: TreePine,
  droplet: Droplet,
  default: Recycle,
};

type PhotoChallenge = {
  id: number;
  title: string;
  description: string | null;
  points: number;
  location?: string | null;
  startAt?: string | null;
  endAt?: string | null;
  time_limit?: string | null;
};

type RegularChallenge = {
  id: number;
  title: string;
  description: string | null;
  points: number;
  iconKey?: string | null;
  status: 'available' | 'completed';
};

type PhotoCompletion = {
  completionKey: number;
  completed_at: string;
  approved: boolean;
  points_awarded: boolean;
};

export function PhotoChallengeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const realtimeConnected = useRealtimeStatus();
  const [activeTab, setActiveTab] = useState<'regular' | 'photo'>('regular');
  const [userId, setUserId] = useState<string | null>(null);

  const [regularChallenges, setRegularChallenges] = useState<RegularChallenge[]>([]);
  const [regularCompletedIds, setRegularCompletedIds] = useState<number[]>([]);
  const [regularError, setRegularError] = useState<string | null>(null);
  const [regularLoading, setRegularLoading] = useState(false);
  const [regularCompletedToday, setRegularCompletedToday] = useState(false);
  const [regularCompletionTable, setRegularCompletionTable] = useState<string | null>(null);
  const [regularChallengeTable, setRegularChallengeTable] = useState<string | null>(null);
  const resolvingCompletionTable = useRef(false);
  const resolvingChallengeTable = useRef(false);
  const [regularUsingCache, setRegularUsingCache] = useState(false);

  const [photoChallenges, setPhotoChallenges] = useState<PhotoChallenge[]>([]);
  const [photoCompletionMap, setPhotoCompletionMap] = useState<Record<number, PhotoCompletion>>({});
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [activeSubmission, setActiveSubmission] = useState<PhotoChallenge | null>(null);
  const [photoUsingCache, setPhotoUsingCache] = useState(false);
  const [photoPage, setPhotoPage] = useState(1);
  const [photoHasNext, setPhotoHasNext] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data?.user?.id ?? null);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const loadCache = async () => {
      if (!userId) return;
      const dateKey = new Date().toISOString().slice(0, 10);

      const cachedRegular = await getCached<RegularChallenge[]>('regular-challenges', CACHE_TTL);
      if (cachedRegular?.value?.length) {
        setRegularChallenges(cachedRegular.value);
        setRegularUsingCache(cachedRegular.isStale);
      }
      const cachedRegularCompletion = await getCached<{
        ids: number[];
        completedToday: boolean;
      }>(`regular-completions:${userId}:${dateKey}`, CACHE_TTL);
      if (cachedRegularCompletion?.value) {
        setRegularCompletedIds(cachedRegularCompletion.value.ids);
        setRegularCompletedToday(cachedRegularCompletion.value.completedToday);
        setRegularUsingCache(cachedRegularCompletion.isStale);
      }

      const cachedPhotoChallenges = await getCached<PhotoChallenge[]>(
        `photo-challenges:${photoPage}`,
        CACHE_TTL
      );
      if (cachedPhotoChallenges?.value?.length) {
        setPhotoChallenges(cachedPhotoChallenges.value);
        setPhotoUsingCache(cachedPhotoChallenges.isStale);
      }
      const cachedPhotoCompletions = await getCached<Record<number, PhotoCompletion>>(
        `photo-completions:${userId}`,
        CACHE_TTL
      );
      if (cachedPhotoCompletions?.value) {
        setPhotoCompletionMap(cachedPhotoCompletions.value);
        setPhotoUsingCache(cachedPhotoCompletions.isStale);
      }
    };
    loadCache();
  }, [userId, photoPage]);

  const resolveRegularCompletionTable = async (): Promise<string | null> => {
    if (regularCompletionTable) return regularCompletionTable;
    if (resolvingCompletionTable.current) return null;

    resolvingCompletionTable.current = true;
    let table: string | null = null;
    for (const candidate of REGULAR_COMPLETION_TABLE_CANDIDATES) {
      const { error } = await supabase.from(candidate).select('challenge_id').limit(1);
      if (error?.code === 'PGRST205') continue;
      table = candidate;
      break;
    }
    if (table) setRegularCompletionTable(table);
    resolvingCompletionTable.current = false;
    return table;
  };

  const resolveRegularChallengeTable = async (): Promise<string | null> => {
    if (regularChallengeTable) return regularChallengeTable;
    if (resolvingChallengeTable.current) return null;
    resolvingChallengeTable.current = true;
    let table: string | null = null;
    for (const candidate of REGULAR_CHALLENGE_TABLE_CANDIDATES) {
      const { error } = await supabase.from(candidate).select('id').limit(1);
      if (error?.code === 'PGRST205') continue;
      table = candidate;
      break;
    }
    if (table) setRegularChallengeTable(table);
    resolvingChallengeTable.current = false;
    return table;
  };

  const logActivity = async (payload: {
    opis: string;
    poena: number;
    kategorija: string;
    status: string;
    putanja_slike?: string | null;
    lokacija?: string | null;
  }) => {
    if (!userId) return;
    await supabase.from(ACTIVITY_TABLE).insert({
      korisnik_id: userId,
      opis: payload.opis,
      poena_dodato: payload.poena,
      kategorija: payload.kategorija,
      status: payload.status,
      putanja_slike: payload.putanja_slike ?? null,
      lokacija: payload.lokacija ?? null,
      kreirano_u: new Date().toISOString(),
    });
  };

  const awardPoints = async (points: number) => {
    if (!userId) return;
    const { error: rpcError } = await supabase.rpc('add_points', { uid: userId, pts: points });
    if (!rpcError) return;

    const { data: profile } = await supabase
      .from('korisnik_profil')
      .select('ukupno_poena')
      .eq('id', userId)
      .maybeSingle();

    const currentPoints = profile?.ukupno_poena ?? 0;
    await supabase
      .from('korisnik_profil')
      .update({ ukupno_poena: currentPoints + points })
      .eq('id', userId);
  };

  const fetchRegularChallenges = async () => {
    if (!userId) return;
    setRegularLoading(true);
    setRegularError(null);

    const table = await resolveRegularCompletionTable();
    if (!table) {
      setRegularError("Tabela zavrsetaka nije dostupna.");
      setRegularLoading(false);
      return;
    }

    const challengeTable = await resolveRegularChallengeTable();
    if (!challengeTable) {
      setRegularError("Tabela izazova nije dostupna.");
      setRegularLoading(false);
      return;
    }

    const { data: ch, error: chErr } = await supabase
      .from(challengeTable)
      .select('id, title, description, points, icon_key')
      .order('id', { ascending: true });

    if (chErr) {
      setRegularError("Ne mogu ucitati izazove.");
      setRegularLoading(false);
      return;
    }

    const { data: comp, error: compErr } = await supabase
      .from(table)
      .select('challenge_id, completed_at')
      .eq('user_id', userId);

    if (compErr) {
      setRegularError("Ne mogu ucitati zavrsetke.");
      setRegularLoading(false);
      return;
    }

    const completedIds = (comp ?? []).map((x) => x.challenge_id);
    setRegularCompletedIds(completedIds);
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(startOfDay.getDate() + 1);
    const completedToday = (comp ?? []).some((row) => {
      const completedAt = row.completed_at ? new Date(row.completed_at) : null;
      return (
        completedAt &&
        completedAt >= startOfDay &&
        completedAt < endOfDay
      );
    });
    setRegularCompletedToday(completedToday);

    const mapped: RegularChallenge[] = (ch ?? []).map((c: any) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      points: c.points,
      iconKey: c.icon_key,
      status: completedIds.includes(c.id) ? 'completed' : 'available',
    }));

    setRegularChallenges(mapped);
    const dateKey = new Date().toISOString().slice(0, 10);
    setCached('regular-challenges', mapped);
    setCached(`regular-completions:${userId}:${dateKey}`, {
      ids: completedIds,
      completedToday,
    });
    setRegularUsingCache(false);
    setRegularLoading(false);
  };

  const completeRegularChallenge = async (challengeId: number, points: number) => {
    if (!userId) return;
    const table = regularCompletionTable || (await resolveRegularCompletionTable());
    if (!table) {
      setRegularError("Tabela zavrsetaka nije dostupna.");
      showError("Gre\u0161ka", "Tabela zavrsetaka nije dostupna.");
      return;
    }

    if (regularCompletedToday) {
      setRegularError("Danas ste vec zavrsili jedan izazov.");
      showInfo("Dnevni limit", "Danas ste vec zavrsili jedan izazov.");
      return;
    }

    if (regularCompletedIds.includes(challengeId)) return;

    const payload = {
      user_id: userId,
      challenge_id: challengeId,
      completed_at: new Date().toISOString(),
    };

    const { error: insErr } = await supabase
      .from(table)
      .upsert(payload, { onConflict: 'user_id,challenge_id' });

    if (insErr) {
      setRegularError("Greska pri zavrsavanju izazova.");
      showError("Gre\u0161ka", "Ne mogu sacuvati zavrsetak.");
      return;
    }

    setRegularCompletedIds((prev) => [...prev, challengeId]);
    setRegularChallenges((prev) =>
      prev.map((c) => (c.id === challengeId ? { ...c, status: 'completed' } : c))
    );

    await awardPoints(points);
    await logActivity({
      opis: "Dnevni izazov zavrsen: #{id}".replace('{id}', String(challengeId)),
      poena: points,
      kategorija: 'regular',
      status: 'completed',
    });
    trackEvent('regular_challenge_completed', { challengeId, points });
    showSuccess("Uspjeh", "Izazov je zavrsen.");
  };

  const fetchPhotoChallenges = async (pageNumber = photoPage) => {
    if (!userId) return;
    setPhotoLoading(true);
    setPhotoError(null);

    const start = (pageNumber - 1) * PHOTO_PAGE_SIZE;
    const end = start + PHOTO_PAGE_SIZE - 1;
    const nowIso = new Date().toISOString();
    const { data, error: fetchError, count } = await supabase
      .from('photoChallenge')
      .select('id, title, description, points, location, startAt, endAt, time_limit', { count: 'exact' })
      .or(`endAt.is.null,endAt.gte.${nowIso}`)
      .order('id', { ascending: true })
      .range(start, end);

    if (fetchError) {
      setPhotoError("Ne mogu ucitati foto izazove.");
      setPhotoLoading(false);
      return;
    }

    const { data: comp, error: compErr } = await supabase
      .from(PHOTO_COMPLETION_TABLE)
      .select(`${PHOTO_COMPLETION_ID_FIELD}, completed_at, approved, points_awarded`)
      .eq('user_id', userId);

    if (compErr) {
      setPhotoError("Ne mogu ucitati statuse.");
      setPhotoLoading(false);
      return;
    }

    const map = (comp ?? []).reduce<Record<number, PhotoCompletion>>((acc, item: any) => {
      const key = item[PHOTO_COMPLETION_ID_FIELD];
      if (!key) return acc;
      acc[key] = {
        completionKey: key,
        completed_at: item.completed_at,
        approved: Boolean(item.approved),
        points_awarded: Boolean(item.points_awarded),
      };
      return acc;
    }, {});

    setPhotoChallenges((data ?? []) as PhotoChallenge[]);
    setPhotoCompletionMap(map);
    setPhotoHasNext(Boolean(count && count > end + 1));
    setCached(`photo-challenges:${pageNumber}`, (data ?? []) as PhotoChallenge[]);
    setCached(`photo-completions:${userId}`, map);
    setPhotoUsingCache(false);
    setPhotoLoading(false);
  };

  useEffect(() => {
    if (userId && activeTab === 'regular') {
      fetchRegularChallenges();
    }
    if (userId && activeTab === 'photo') {
      fetchPhotoChallenges(photoPage);
    }
  }, [userId, activeTab, photoPage]);

  useEffect(() => {
    if (activeTab !== 'photo') return;
    setPhotoPage(1);
  }, [activeTab]);

  useEffect(() => {
    if (!userId || realtimeConnected) return;
    const interval = setInterval(() => {
      if (activeTab === 'regular') {
        fetchRegularChallenges();
      } else {
        fetchPhotoChallenges();
      }
    }, 20000);
    return () => clearInterval(interval);
  }, [userId, activeTab, realtimeConnected, photoPage]);

  useEffect(() => {
    if (!userId) return;
    let regularChannel: ReturnType<typeof supabase.channel> | null = null;
    let regularChallengesChannel: ReturnType<typeof supabase.channel> | null = null;
    let photoChallengesChannel: ReturnType<typeof supabase.channel> | null = null;
    if (regularCompletionTable) {
      regularChannel = supabase
        .channel('regular-completions')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: regularCompletionTable,
            filter: `user_id=eq.${userId}`,
          },
          () => fetchRegularChallenges()
        )
        .subscribe();
    }

    const photoChannel = supabase
      .channel('photo-completions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: PHOTO_COMPLETION_TABLE,
          filter: `user_id=eq.${userId}`,
        },
        () => fetchPhotoChallenges()
      )
      .subscribe();

    if (regularChallengeTable) {
      regularChallengesChannel = supabase
        .channel('regular-challenges')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: regularChallengeTable,
          },
          () => fetchRegularChallenges()
        )
        .subscribe();
    }

    photoChallengesChannel = supabase
      .channel('photo-challenges')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'photoChallenge',
        },
        () => fetchPhotoChallenges()
      )
      .subscribe();

    return () => {
      if (regularChannel) supabase.removeChannel(regularChannel);
      if (regularChallengesChannel) supabase.removeChannel(regularChallengesChannel);
      if (photoChallengesChannel) supabase.removeChannel(photoChallengesChannel);
      supabase.removeChannel(photoChannel);
    };
  }, [userId, regularCompletionTable, regularChallengeTable, photoPage]);

  useEffect(() => {
    const awardApproved = async () => {
      if (!userId) return;

      const pendingAwards = Object.values(photoCompletionMap).filter(
        (completion) => completion.approved && !completion.points_awarded
      );

      if (pendingAwards.length === 0) return;

      for (const completion of pendingAwards) {
        const challenge = photoChallenges.find((c) => c.id === completion.completionKey);
        if (!challenge) continue;

        await awardPoints(challenge.points);
        await supabase
          .from(PHOTO_COMPLETION_TABLE)
          .update({ points_awarded: true })
          .eq('user_id', userId)
          .eq(PHOTO_COMPLETION_ID_FIELD, completion.completionKey);

        await logActivity({
          opis: "Foto izazov odobren: {title}".replace('{title}', challenge.title),
          poena: challenge.points,
          kategorija: 'photo',
          status: 'completed',
        });
        trackEvent('photo_challenge_points_awarded', {
          challengeId: completion.completionKey,
          points: challenge.points,
        });
      }

      fetchPhotoChallenges();
    };

    awardApproved();
  }, [photoCompletionMap, photoChallenges, userId]);

  const handleSubmitPhoto = async (
    submission: {
      challengeId: number;
      photoUri: string;
      description: string;
      location?: string;
    },
    onProgress?: (value: number) => void
  ): Promise<{ success: boolean; error?: string }> => {
    if (!userId) {
      return { success: false, error: "Potrebna je prijava." };
    }

    setPhotoError(null);
    const optimistic: PhotoCompletion = {
      completionKey: submission.challengeId,
      completed_at: new Date().toISOString(),
      approved: false,
      points_awarded: false,
    };
    setPhotoCompletionMap((prev) => ({ ...prev, [submission.challengeId]: optimistic }));

    try {
      const { publicUrl } = await uploadPhotoChallenge({
        uri: submission.photoUri,
        userId,
        challengeId: submission.challengeId,
        onProgress,
      });

      onProgress?.(0.95);
      const payload = {
        user_id: userId,
        [PHOTO_COMPLETION_ID_FIELD]: submission.challengeId,
        completed_at: new Date().toISOString(),
        approved: false,
        points_awarded: false,
        image_url: publicUrl,
        description: submission.description ?? null,
        location: submission.location ?? null,
      };

      const { error: submitError } = await supabase
        .from(PHOTO_COMPLETION_TABLE)
        .upsert(payload, { onConflict: 'user_id,photo_challenge_id' });

      if (submitError) {
        throw submitError;
      }

      const challenge = photoChallenges.find((c) => c.id === submission.challengeId);
      await logActivity({
        opis: challenge
          ? "Foto izazov poslat: {title}".replace('{title}', challenge.title)
          : "Foto izazov poslat: #{id}".replace('{id}', String(submission.challengeId)),
        poena: 0,
        kategorija: 'photo',
        status: 'pending',
        putanja_slike: publicUrl,
        lokacija: submission.location ?? null,
      });

      setActiveSubmission(null);
      fetchPhotoChallenges();
      showSuccess("Poslato", "Prijava je poslata.");
      return { success: true };
    } catch (err: any) {
      console.error('Photo submission error', err);
      setPhotoCompletionMap((prev) => {
        const next = { ...prev };
        delete next[submission.challengeId];
        return next;
      });
      const message =
        err?.message ?? err?.details ?? err?.hint ?? "Greska pri slanju prijave.";
      setPhotoError(message);
      showError("Gre\u0161ka", message);
      return { success: false, error: message };
    }
  };

  const photoCards = useMemo(() => {
    return photoChallenges.map((challenge) => {
      const completion = photoCompletionMap[challenge.id];
      const status = completion
        ? completion.approved
          ? 'completed'
          : 'pending'
        : 'available';
      return { ...challenge, status };
    });
  }, [photoChallenges, photoCompletionMap]);

  const photoHasPrev = photoPage > 1;

  return (
    <GradientBackground>
      <ScreenFade>
        <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.title}>{"Izazovi"}</Text>
            <Text style={styles.subtitle}>{"Redovni i foto izazovi"}</Text>
          </View>
          {activeTab === 'photo' ? (
            <TouchableOpacity onPress={() => navigation.navigate('CreateChallenge')}>
              <LinearGradient colors={gradients.primary} style={styles.createButton}>
                <Plus color={colors.text} size={16} />
                <Text style={styles.createLabel}>{"Kreiraj"}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'regular' && styles.tabActive]}
            onPress={() => setActiveTab('regular')}
          >
            <Text style={[styles.tabText, activeTab === 'regular' && styles.tabTextActive]}>
              {"Redovni"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'photo' && styles.tabActive]}
            onPress={() => setActiveTab('photo')}
          >
            <Text style={[styles.tabText, activeTab === 'photo' && styles.tabTextActive]}>
              {"Foto"}
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'regular' && (
          <View style={styles.section}>
            {regularLoading && regularChallenges.length === 0 ? (
              <View style={styles.skeletonGroup}>
                {Array.from({ length: 3 }).map((_, index) => (
                  <GlowCard key={`regular-skeleton-${index}`} style={styles.cardShell} contentStyle={styles.card}>
                    <SkeletonBlock width="70%" height={14} />
                    <SkeletonBlock width="90%" height={10} style={{ marginTop: 8 }} />
                    <SkeletonBlock width="50%" height={12} style={{ marginTop: 12 }} />
                  </GlowCard>
                ))}
              </View>
            ) : regularLoading ? (
              <Text style={styles.muted}>{"U\u010ditavanje..."}</Text>
            ) : null}
            {regularError && <Text style={styles.error}>{regularError}</Text>}
            {regularUsingCache && <Text style={styles.cacheNote}>{"Prikazujem ke\u0161irane podatke."}</Text>}
            {regularCompletedToday ? (
              <Text style={styles.limitNote}>{"Danas ste vec zavrsili jedan izazov."}</Text>
            ) : null}
            {regularChallenges.length === 0 && !regularLoading ? (
              <Text style={styles.muted}>{"Nema dostupnih izazova."}</Text>
            ) : null}
            {regularChallenges.map((challenge) => {
              const Icon = iconMap[challenge.iconKey ?? 'default'] ?? iconMap.default;
              return (
                <GlowCard key={challenge.id} style={styles.cardShell} contentStyle={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardIcon}>
                      <LinearGradient colors={gradients.primary} style={styles.iconBadge}>
                        <Icon color={colors.text} size={18} />
                      </LinearGradient>
                    </View>
                    <View style={styles.cardText}>
                      <Text style={styles.cardTitle}>{challenge.title}</Text>
                      {challenge.description ? (
                        <Text style={styles.cardDescription}>{challenge.description}</Text>
                      ) : null}
                    </View>
                    {challenge.status === 'completed' && <CheckCircle2 color={colors.primary} size={20} />}
                  </View>
                  <Text style={styles.points}>
                    +{challenge.points} {"poena"}
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      (challenge.status === 'completed' || regularCompletedToday) && styles.actionDisabled,
                    ]}
                    onPress={() => completeRegularChallenge(challenge.id, challenge.points)}
                    disabled={challenge.status === 'completed' || regularCompletedToday}
                  >
                    <LinearGradient colors={gradients.primary} style={styles.actionInner}>
                      <Text style={styles.actionLabel}>
                        {challenge.status === 'completed'
                          ? "Zavrseno"
                          : regularCompletedToday
                          ? "Limit dostignut"
                          : "Zavrsi"}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </GlowCard>
              );
            })}
          </View>
        )}

        {activeTab === 'photo' && (
          <View style={styles.section}>
            {photoLoading && photoCards.length === 0 ? (
              <View style={styles.skeletonGroup}>
                {Array.from({ length: 3 }).map((_, index) => (
                  <GlowCard key={`photo-skeleton-${index}`} style={styles.cardShell} contentStyle={styles.card}>
                    <SkeletonBlock width="60%" height={14} />
                    <SkeletonBlock width="90%" height={10} style={{ marginTop: 8 }} />
                    <SkeletonBlock width="50%" height={12} style={{ marginTop: 12 }} />
                  </GlowCard>
                ))}
              </View>
            ) : photoLoading ? (
              <Text style={styles.muted}>{"U\u010ditavanje..."}</Text>
            ) : null}
            {photoError && <Text style={styles.error}>{photoError}</Text>}
            {photoUsingCache && <Text style={styles.cacheNote}>{"Prikazujem ke\u0161irane podatke."}</Text>}
            <View style={styles.photoPager}>
              <TouchableOpacity
                onPress={() => setPhotoPage((prev) => Math.max(1, prev - 1))}
                disabled={!photoHasPrev || photoLoading}
                style={[styles.pagerButton, (!photoHasPrev || photoLoading) && styles.pagerButtonDisabled]}
              >
                <ChevronLeft size={16} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.pagerLabel}>
                {"Strana {page}".replace('{page}', String(photoPage))}
              </Text>
              <TouchableOpacity
                onPress={() => setPhotoPage((prev) => prev + 1)}
                disabled={!photoHasNext || photoLoading}
                style={[styles.pagerButton, (!photoHasNext || photoLoading) && styles.pagerButtonDisabled]}
              >
                <ChevronRight size={16} color={colors.text} />
              </TouchableOpacity>
            </View>
            {photoCards.length === 0 && !photoLoading ? (
              <Text style={styles.muted}>{"Trenutno nema foto izazova."}</Text>
            ) : null}
            {photoCards.map((challenge) => {
              let remaining = '';
              if (challenge.endAt) {
                const end = new Date(challenge.endAt);
                const diff = Math.max(0, end.getTime() - Date.now());
                const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                remaining = "Preostalo {days} dana".replace('{days}', String(days));
              }
              return (
              <GlowCard key={challenge.id} style={styles.cardShell} contentStyle={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardText}>
                    <Text style={styles.cardTitle}>{challenge.title}</Text>
                    {challenge.description ? (
                      <Text style={styles.cardDescription}>{challenge.description}</Text>
                    ) : null}
                    {remaining ? <Text style={styles.cardMeta}>{remaining}</Text> : null}
                  </View>
                  {challenge.status === 'completed' ? (
                    <CheckCircle2 color={colors.primary} size={20} />
                  ) : challenge.status === 'pending' ? (
                    <AlertTriangle color={colors.danger} size={20} />
                  ) : (
                    <Camera color={colors.primary} size={20} />
                  )}
                </View>
                <Text style={styles.points}>
                  +{challenge.points} {"poena"}
                </Text>
                <TouchableOpacity
                  style={[styles.actionButton, challenge.status !== 'available' && styles.actionDisabled]}
                  onPress={() => {
                    if (challenge.status !== 'available') return;
                    void triggerHaptic('selection');
                    setActiveSubmission(challenge);
                  }}
                  disabled={challenge.status !== 'available'}
                  accessibilityRole="button"
                  accessibilityLabel={"Posalji fotografiju za {title}".replace('{title}', challenge.title)}
                >
                  <LinearGradient colors={gradients.primary} style={styles.actionInner}>
                    <Text style={styles.actionLabel}>
                      {challenge.status === 'available'
                        ? "Posalji"
                        : challenge.status === 'pending'
                        ? "Na cekanju"
                        : "Odobreno"}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </GlowCard>
            );})}
          </View>
        )}

        {activeSubmission ? (
          <PhotoSubmission
            visible={Boolean(activeSubmission)}
            challengeId={activeSubmission.id}
            challengeTitle={activeSubmission.title}
            challengePoints={activeSubmission.points}
            onSubmit={handleSubmitPhoto}
            onCancel={() => setActiveSubmission(null)}
          />
        ) : null}
        </ScrollView>
      </ScreenFade>
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
  },
  subtitle: {
    color: colors.softGreen,
    marginBottom: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.lg,
  },
  createLabel: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 12,
  },
  tabs: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
  },
  tabActive: {
    borderColor: 'rgba(34, 197, 94, 0.3)',
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  tabText: {
    color: colors.muted,
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.softGreen,
  },
  photoPager: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  pagerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
  },
  pagerButtonDisabled: {
    opacity: 0.4,
  },
  pagerLabel: {
    color: colors.muted,
    fontWeight: '500',
  },
  section: {
    marginBottom: spacing.lg,
  },
  muted: {
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  error: {
    color: colors.danger,
    marginBottom: spacing.md,
  },
  cacheNote: {
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  limitNote: {
    color: colors.softGreen,
    marginBottom: spacing.sm,
  },
  card: {
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  cardShell: {
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardIcon: {
    marginRight: spacing.sm,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  cardTitle: {
    color: colors.text,
    fontWeight: '600',
  },
  cardDescription: {
    color: colors.muted,
    marginTop: spacing.xs,
  },
  cardMeta: {
    color: colors.softGreen,
    marginTop: spacing.xs,
    fontSize: 12,
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
    opacity: 0.6,
  },
  actionLabel: {
    color: colors.text,
    fontWeight: '600',
  },
  skeletonGroup: {
    gap: spacing.sm,
  },
});
