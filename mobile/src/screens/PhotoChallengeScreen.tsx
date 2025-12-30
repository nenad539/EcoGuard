import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Camera, CheckCircle2, AlertTriangle, Recycle, TreePine, Droplet } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { colors, radius, spacing, gradients } from '../styles/common';
import { GradientBackground } from '../components/common/GradientBackground';
import { LinearGradient } from 'expo-linear-gradient';
import { PhotoSubmission } from '../components/PhotoSubmission';

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
  const [activeTab, setActiveTab] = useState<'regular' | 'photo'>('regular');
  const [userId, setUserId] = useState<string | null>(null);

  const [regularChallenges, setRegularChallenges] = useState<RegularChallenge[]>([]);
  const [regularCompletedIds, setRegularCompletedIds] = useState<number[]>([]);
  const [regularError, setRegularError] = useState<string | null>(null);
  const [regularLoading, setRegularLoading] = useState(false);
  const [regularCompletionTable, setRegularCompletionTable] = useState<string | null>(null);
  const [regularChallengeTable, setRegularChallengeTable] = useState<string | null>(null);
  const resolvingCompletionTable = useRef(false);
  const resolvingChallengeTable = useRef(false);

  const [photoChallenges, setPhotoChallenges] = useState<PhotoChallenge[]>([]);
  const [photoCompletionMap, setPhotoCompletionMap] = useState<Record<number, PhotoCompletion>>({});
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [activeSubmission, setActiveSubmission] = useState<PhotoChallenge | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data?.user?.id ?? null);
    };
    fetchUser();
  }, []);

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
      .single();

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
      setRegularError('Nismo pronašli tabelu za završene izazove (regular).');
      setRegularLoading(false);
      return;
    }

    const challengeTable = await resolveRegularChallengeTable();
    if (!challengeTable) {
      setRegularError('Tabela regularnih izazova nije pronađena.');
      setRegularLoading(false);
      return;
    }

    const { data: ch, error: chErr } = await supabase
      .from(challengeTable)
      .select('id, title, description, points, icon_key')
      .order('id', { ascending: true });

    if (chErr) {
      setRegularError('Greška pri učitavanju izazova.');
      setRegularLoading(false);
      return;
    }

    const { data: comp, error: compErr } = await supabase
      .from(table)
      .select('challenge_id, completed_at')
      .eq('user_id', userId);

    if (compErr) {
      setRegularError('Greška pri učitavanju završenih izazova.');
      setRegularLoading(false);
      return;
    }

    const completedIds = (comp ?? []).map((x) => x.challenge_id);
    setRegularCompletedIds(completedIds);

    const mapped = (ch ?? []).map((c: any) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      points: c.points,
      iconKey: c.icon_key,
      status: completedIds.includes(c.id) ? 'completed' : 'available',
    }));

    setRegularChallenges(mapped);
    setRegularLoading(false);
  };

  const completeRegularChallenge = async (challengeId: number, points: number) => {
    if (!userId) return;
    const table = regularCompletionTable || (await resolveRegularCompletionTable());
    if (!table) {
      setRegularError('Nismo pronašli tabelu za završene izazove (regular).');
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
      setRegularError('Greška pri završavanju izazova.');
      return;
    }

    setRegularCompletedIds((prev) => [...prev, challengeId]);
    setRegularChallenges((prev) =>
      prev.map((c) => (c.id === challengeId ? { ...c, status: 'completed' } : c))
    );

    await awardPoints(points);
    await logActivity({
      opis: `Završen izazov #${challengeId}`,
      poena: points,
      kategorija: 'regular',
      status: 'completed',
    });
  };

  const fetchPhotoChallenges = async () => {
    if (!userId) return;
    setPhotoLoading(true);
    setPhotoError(null);

    const { data, error: fetchError } = await supabase
      .from('photoChallenge')
      .select('*')
      .order('id', { ascending: true });

    if (fetchError) {
      setPhotoError('Greška pri učitavanju foto izazova.');
      setPhotoLoading(false);
      return;
    }

    const { data: comp, error: compErr } = await supabase
      .from(PHOTO_COMPLETION_TABLE)
      .select(`${PHOTO_COMPLETION_ID_FIELD}, completed_at, approved, points_awarded`)
      .eq('user_id', userId);

    if (compErr) {
      setPhotoError('Greška pri učitavanju završenih foto izazova.');
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

    setPhotoChallenges(data ?? []);
    setPhotoCompletionMap(map);
    setPhotoLoading(false);
  };

  useEffect(() => {
    if (userId && activeTab === 'regular') {
      fetchRegularChallenges();
    }
    if (userId && activeTab === 'photo') {
      fetchPhotoChallenges();
    }
  }, [userId, activeTab]);

  useEffect(() => {
    if (!userId) return;
    const interval = setInterval(() => {
      if (activeTab === 'regular') {
        fetchRegularChallenges();
      } else {
        fetchPhotoChallenges();
      }
    }, 20000);
    return () => clearInterval(interval);
  }, [userId, activeTab]);

  useEffect(() => {
    if (!userId) return;
    let regularChannel: ReturnType<typeof supabase.channel> | null = null;
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

    return () => {
      if (regularChannel) supabase.removeChannel(regularChannel);
      supabase.removeChannel(photoChannel);
    };
  }, [userId, regularCompletionTable]);

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
          opis: `Foto izazov odobren: ${challenge.title}`,
          poena: challenge.points,
          kategorija: 'photo',
          status: 'completed',
        });
      }

      fetchPhotoChallenges();
    };

    awardApproved();
  }, [photoCompletionMap, photoChallenges, userId]);

  const handleSubmitPhoto = async (submission: {
    challengeId: number;
    photo: string;
    description: string;
    location?: string;
  }) => {
    if (!userId) return;

    const payload = {
      user_id: userId,
      [PHOTO_COMPLETION_ID_FIELD]: submission.challengeId,
      completed_at: new Date().toISOString(),
      approved: false,
      points_awarded: false,
      image_url: submission.photo,
      description: submission.description ?? null,
      location: submission.location ?? null,
    };

    const { error: submitError } = await supabase
      .from(PHOTO_COMPLETION_TABLE)
      .upsert(payload, { onConflict: 'user_id,photo_challenge_id' });

    if (submitError) {
      setPhotoError('Greška pri završavanju foto izazova.');
      return;
    }

    const challenge = photoChallenges.find((c) => c.id === submission.challengeId);
    await logActivity({
      opis: challenge ? `Poslan foto izazov: ${challenge.title}` : `Poslan foto izazov #${submission.challengeId}`,
      poena: 0,
      kategorija: 'photo',
      status: 'pending',
      putanja_slike: submission.photo,
      lokacija: submission.location ?? null,
    });

    setActiveSubmission(null);
    fetchPhotoChallenges();
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

  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Izazovi</Text>
        <Text style={styles.subtitle}>Regularni i foto izazovi</Text>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'regular' && styles.tabActive]}
            onPress={() => setActiveTab('regular')}
          >
            <Text style={[styles.tabText, activeTab === 'regular' && styles.tabTextActive]}>Regularni</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'photo' && styles.tabActive]}
            onPress={() => setActiveTab('photo')}
          >
            <Text style={[styles.tabText, activeTab === 'photo' && styles.tabTextActive]}>Foto</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'regular' && (
          <View style={styles.section}>
            {regularLoading && <Text style={styles.muted}>Učitavanje...</Text>}
            {regularError && <Text style={styles.error}>{regularError}</Text>}
            {regularChallenges.length === 0 && !regularLoading ? (
              <Text style={styles.muted}>Nema regularnih izazova.</Text>
            ) : null}
            {regularChallenges.map((challenge) => {
              const Icon = iconMap[challenge.iconKey ?? 'default'] ?? iconMap.default;
              return (
                <View key={challenge.id} style={styles.card}>
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
                  <Text style={styles.points}>+{challenge.points} poena</Text>
                  <TouchableOpacity
                    style={[styles.actionButton, challenge.status === 'completed' && styles.actionDisabled]}
                    onPress={() => completeRegularChallenge(challenge.id, challenge.points)}
                    disabled={challenge.status === 'completed'}
                  >
                    <LinearGradient colors={gradients.primary} style={styles.actionInner}>
                      <Text style={styles.actionLabel}>
                        {challenge.status === 'completed' ? 'Završen' : 'Završi'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {activeTab === 'photo' && (
          <View style={styles.section}>
            {photoLoading && <Text style={styles.muted}>Učitavanje...</Text>}
            {photoError && <Text style={styles.error}>{photoError}</Text>}
            {photoCards.length === 0 && !photoLoading ? (
              <Text style={styles.muted}>Nema foto izazova.</Text>
            ) : null}
            {photoCards.map((challenge) => (
              <View key={challenge.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardText}>
                    <Text style={styles.cardTitle}>{challenge.title}</Text>
                    {challenge.description ? (
                      <Text style={styles.cardDescription}>{challenge.description}</Text>
                    ) : null}
                  </View>
                  {challenge.status === 'completed' ? (
                    <CheckCircle2 color={colors.primary} size={20} />
                  ) : challenge.status === 'pending' ? (
                    <AlertTriangle color={colors.danger} size={20} />
                  ) : (
                    <Camera color={colors.primary} size={20} />
                  )}
                </View>
                <Text style={styles.points}>+{challenge.points} poena</Text>
                <TouchableOpacity
                  style={[styles.actionButton, challenge.status !== 'available' && styles.actionDisabled]}
                  onPress={() => setActiveSubmission(challenge)}
                  disabled={challenge.status !== 'available'}
                >
                  <LinearGradient colors={gradients.primary} style={styles.actionInner}>
                    <Text style={styles.actionLabel}>
                      {challenge.status === 'available'
                        ? 'Pošalji fotografiju'
                        : challenge.status === 'pending'
                        ? 'Na čekanju'
                        : 'Odobreno'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ))}
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
});
