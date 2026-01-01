import React, { useEffect, useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CheckCircle2, XCircle, Camera, Users } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { showError, showSuccess } from '../lib/toast';
import { colors, gradients, radius, spacing } from '../styles/common';
import { GradientBackground } from '../components/common/GradientBackground';
import { ScreenFade } from '../components/common/ScreenFade';
import { BackButton } from '../components/common/BackButton';
import { EmptyState } from '../components/common/EmptyState';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { GlowCard } from '../components/common/GlowCard';

const PHOTO_COMPLETIONS_TABLE = 'photo_challenge_completions';
const GROUP_SUBMISSIONS_TABLE = 'group_activity_submissions';
const STORAGE_BUCKET = 'photo-challenge-submissions';
const PHOTO_CHALLENGE_TABLE = 'photoChallenge';

type PhotoQueueItem = {
  id: number;
  user_id: string;
  photo_challenge_id: number;
  description: string | null;
  location: string | null;
  image_url: string | null;
  submitted_at: string | null;
  points_awarded: boolean;
};

type GroupQueueItem = {
  id: number;
  user_id: string;
  group_id: string;
  activity_id: number;
  description: string | null;
  location: string | null;
  image_url: string | null;
  submitted_at: string | null;
  points_awarded: boolean;
};

type ChallengeInfo = {
  id: number;
  title: string;
  points: number;
};

type GroupInfo = {
  id: string;
  name: string;
};

type ActivityInfo = {
  id: number;
  title: string;
  points: number | null;
  group_id: string;
};

type ProfileInfo = {
  id: string;
  korisnicko_ime: string;
};

export function AdminModerationScreen() {
  const navigation = useNavigation();
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'photo' | 'group'>('photo');

  const [photoQueue, setPhotoQueue] = useState<PhotoQueueItem[]>([]);
  const [groupQueue, setGroupQueue] = useState<GroupQueueItem[]>([]);
  const [photoChallenges, setPhotoChallenges] = useState<Record<number, ChallengeInfo>>({});
  const [groupActivities, setGroupActivities] = useState<Record<number, ActivityInfo>>({});
  const [groups, setGroups] = useState<Record<string, GroupInfo>>({});
  const [profiles, setProfiles] = useState<Record<string, ProfileInfo>>({});

  const resolveSignedUrl = async (url: string | null) => {
    if (!url) return null;
    const marker = `/${STORAGE_BUCKET}/`;
    const index = url.indexOf(marker);
    if (index === -1) return url;
    const path = url.slice(index + marker.length);
    if (!path) return url;
    const { data, error } = await supabase.storage.from(STORAGE_BUCKET).createSignedUrl(path, 60 * 60);
    if (error || !data?.signedUrl) return url;
    return data.signedUrl;
  };

  const loadUser = async () => {
    const { data } = await supabase.auth.getUser();
    const uid = data?.user?.id ?? null;
    setUserId(uid);
    if (!uid) return;

    const { data: adminRow } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', uid)
      .maybeSingle();
    setIsAdmin(Boolean(adminRow));
  };

  const loadProfiles = async (ids: string[]) => {
    if (!ids.length) return;
    const { data } = await supabase
      .from('korisnik_profil')
      .select('id, korisnicko_ime')
      .in('id', ids);
    const map = (data ?? []).reduce<Record<string, ProfileInfo>>((acc, row) => {
      acc[row.id] = row as ProfileInfo;
      return acc;
    }, {});
    setProfiles((prev) => ({ ...prev, ...map }));
  };

  const loadPhotoQueue = async () => {
    const { data, error } = await supabase
      .from(PHOTO_COMPLETIONS_TABLE)
      .select('id, user_id, photo_challenge_id, description, location, image_url, submitted_at, points_awarded')
      .eq('approved', false)
      .order('submitted_at', { ascending: false })
      .limit(50);

    if (error) {
      showError("Gre\u0161ka", "Ne mogu ucitati foto prijave.");
      return;
    }

    const rows = (data ?? []) as PhotoQueueItem[];
    const withImages = await Promise.all(
      rows.map(async (row) => ({
        ...row,
        image_url: await resolveSignedUrl(row.image_url),
      }))
    );
    setPhotoQueue(withImages);

    const challengeIds = Array.from(new Set(rows.map((row) => row.photo_challenge_id)));
    if (challengeIds.length) {
      const { data: challenges, error: challengeError } = await supabase
        .from(PHOTO_CHALLENGE_TABLE)
        .select('id, title, points')
        .in('id', challengeIds);
      if (challengeError) {
        showError("Gre\u0161ka", challengeError.message);
      } else {
        const map = (challenges ?? []).reduce<Record<number, ChallengeInfo>>((acc, item) => {
          acc[item.id] = item as ChallengeInfo;
          return acc;
        }, {});
        setPhotoChallenges(map);
      }
    }

    const userIds = Array.from(new Set(rows.map((row) => row.user_id)));
    await loadProfiles(userIds);
  };

  const loadGroupQueue = async () => {
    const { data, error } = await supabase
      .from(GROUP_SUBMISSIONS_TABLE)
      .select('id, user_id, group_id, activity_id, description, location, image_url, submitted_at, points_awarded')
      .eq('approved', false)
      .order('submitted_at', { ascending: false })
      .limit(50);

    if (error) {
      showError("Gre\u0161ka", "Ne mogu ucitati grupne prijave.");
      return;
    }

    const rows = (data ?? []) as GroupQueueItem[];
    const withImages = await Promise.all(
      rows.map(async (row) => ({
        ...row,
        image_url: await resolveSignedUrl(row.image_url),
      }))
    );
    setGroupQueue(withImages);

    const activityIds = Array.from(new Set(rows.map((row) => row.activity_id)));
    if (activityIds.length) {
      const { data: activities } = await supabase
        .from('group_activities')
        .select('id, title, points, group_id')
        .in('id', activityIds);
      const map = (activities ?? []).reduce<Record<number, ActivityInfo>>((acc, item) => {
        acc[item.id] = item as ActivityInfo;
        return acc;
      }, {});
      setGroupActivities(map);

      const groupIds = Array.from(new Set((activities ?? []).map((item) => item.group_id)));
      if (groupIds.length) {
        const { data: groupRows } = await supabase
          .from('groups')
          .select('id, name')
          .in('id', groupIds);
        const groupMap = (groupRows ?? []).reduce<Record<string, GroupInfo>>((acc, item) => {
          acc[item.id] = item as GroupInfo;
          return acc;
        }, {});
        setGroups(groupMap);
      }
    }

    const userIds = Array.from(new Set(rows.map((row) => row.user_id)));
    await loadProfiles(userIds);
  };

  const loadQueues = async () => {
    if (!isAdmin) return;
    setLoading(true);
    await Promise.all([loadPhotoQueue(), loadGroupQueue()]);
    setLoading(false);
  };

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    loadQueues();
  }, [isAdmin]);

  const awardPoints = async (targetUserId: string, points: number, incrementChallenges = true) => {
    const { data: profile } = await supabase
      .from('korisnik_profil')
      .select('ukupno_poena, izazova_zavrseno')
      .eq('id', targetUserId)
      .maybeSingle();

    const currentPoints = profile?.ukupno_poena ?? 0;
    const currentChallenges = profile?.izazova_zavrseno ?? 0;

    await supabase
      .from('korisnik_profil')
      .update({
        ukupno_poena: currentPoints + points,
        izazova_zavrseno: incrementChallenges ? currentChallenges + 1 : currentChallenges,
      })
      .eq('id', targetUserId);
  };

  const logActivity = async (payload: {
    korisnik_id: string;
    opis: string;
    poena: number;
    kategorija: string;
    status: string;
    putanja_slike?: string | null;
    lokacija?: string | null;
  }) => {
    await supabase.from('aktivnosti').insert({
      korisnik_id: payload.korisnik_id,
      opis: payload.opis,
      poena_dodato: payload.poena,
      kategorija: payload.kategorija,
      status: payload.status,
      putanja_slike: payload.putanja_slike ?? null,
      lokacija: payload.lokacija ?? null,
      kreirano_u: new Date().toISOString(),
    });
  };

  const notifyUser = async (targetId: string, title: string, body: string, relatedId?: string) => {
    await supabase.from('notifications').insert({
      korisnik_id: targetId,
      title,
      body,
      type: 'moderation',
      related_id: relatedId ?? null,
      status: 'unread',
    });
  };

  const approvePhoto = async (item: PhotoQueueItem) => {
    if (!userId) return;
    const challenge = photoChallenges[item.photo_challenge_id];
    const points = challenge?.points ?? 0;

    const { error: approveError } = await supabase
      .from(PHOTO_COMPLETIONS_TABLE)
      .update({
        approved: true,
        approved_by: userId,
        approved_at: new Date().toISOString(),
      })
      .eq('id', item.id);

    if (approveError) {
      showError("Gre\u0161ka", approveError.message);
      return;
    }

    if (!item.points_awarded && points > 0) {
      await awardPoints(item.user_id, points, true);
      const { error: awardError } = await supabase
        .from(PHOTO_COMPLETIONS_TABLE)
        .update({ points_awarded: true })
        .eq('id', item.id);
      if (awardError) {
        showError("Gre\u0161ka", awardError.message);
      }
    }

    await logActivity({
      korisnik_id: item.user_id,
      opis: "Foto prijava odobrena: {title}".replace('{title}', challenge?.title ?? "Izazov"),
      poena: points,
      kategorija: 'photo',
      status: 'approved',
      putanja_slike: item.image_url,
      lokacija: item.location,
    });

    await notifyUser(
      item.user_id,
      "Foto prijava odobrena",
      "Vasa foto prijava za {title} je odobrena.".replace('{title}', challenge?.title ?? "Foto izazov"),
      String(item.id)
    );

    showSuccess("Uspjeh", "Foto prijava je odobrena.");
    loadPhotoQueue();
  };

  const rejectPhoto = async (item: PhotoQueueItem) => {
    const { error } = await supabase.from(PHOTO_COMPLETIONS_TABLE).delete().eq('id', item.id);
    if (error) {
      showError("Gre\u0161ka", error.message);
      return;
    }
    await logActivity({
      korisnik_id: item.user_id,
      opis: "Foto prijava odbijena",
      poena: 0,
      kategorija: 'photo',
      status: 'rejected',
      putanja_slike: item.image_url,
      lokacija: item.location,
    });
    await notifyUser(
      item.user_id,
      "Foto prijava odbijena",
      "Tvoja foto prijava je odbijena.",
      String(item.id)
    );
    showSuccess("Uspjeh", "Prijava je odbijena.");
    loadPhotoQueue();
  };

  const approveGroup = async (item: GroupQueueItem) => {
    if (!userId) return;
    const activity = groupActivities[item.activity_id];
    const points = activity?.points ?? 0;

    const { error: approveError } = await supabase
      .from(GROUP_SUBMISSIONS_TABLE)
      .update({
        approved: true,
        approved_by: userId,
        approved_at: new Date().toISOString(),
      })
      .eq('id', item.id);

    if (approveError) {
      showError("Gre\u0161ka", approveError.message);
      return;
    }

    if (!item.points_awarded && points > 0) {
      await awardPoints(item.user_id, points, false);
      const { error: awardError } = await supabase
        .from(GROUP_SUBMISSIONS_TABLE)
        .update({ points_awarded: true })
        .eq('id', item.id);
      if (awardError) {
        showError("Gre\u0161ka", awardError.message);
      }
    }

    await logActivity({
      korisnik_id: item.user_id,
      opis: "Grupna aktivnost odobrena: {title}".replace('{title}', activity?.title ?? "Aktivnost"),
      poena: points ?? 0,
      kategorija: 'group',
      status: 'approved',
      putanja_slike: item.image_url,
      lokacija: item.location,
    });

    await notifyUser(
      item.user_id,
      "Grupna aktivnost odobrena",
      "Tvoja prijava za grupnu aktivnost {title} je odobrena.".replace('{title}', activity?.title ?? "Aktivnost"),
      String(item.id)
    );

    showSuccess("Uspjeh", "Prijava za grupu je odobrena.");
    loadGroupQueue();
  };

  const rejectGroup = async (item: GroupQueueItem) => {
    const { error } = await supabase.from(GROUP_SUBMISSIONS_TABLE).delete().eq('id', item.id);
    if (error) {
      showError("Gre\u0161ka", error.message);
      return;
    }
    await logActivity({
      korisnik_id: item.user_id,
      opis: "Grupna prijava odbijena",
      poena: 0,
      kategorija: 'group',
      status: 'rejected',
      putanja_slike: item.image_url,
      lokacija: item.location,
    });
    await notifyUser(
      item.user_id,
      "Grupna prijava odbijena",
      "Tvoja prijava za grupnu aktivnost je odbijena.",
      String(item.id)
    );
    showSuccess("Uspjeh", "Prijava je odbijena.");
    loadGroupQueue();
  };

  const photoCards = useMemo(() => photoQueue, [photoQueue]);
  const groupCards = useMemo(() => groupQueue, [groupQueue]);

  return (
    <GradientBackground>
      <ScreenFade>
        <ScrollView contentContainerStyle={styles.content}>
          <BackButton onPress={() => navigation.goBack()} />
          <View style={styles.header}>
            <Text style={styles.title}>{"Moderacija prijava"}</Text>
            <Text style={styles.subtitle}>{"Odobri ili odbij foto i grupne prijave."}</Text>
          </View>

          {!isAdmin ? (
            <EmptyState
              title={"Nemate pristup"}
              description={"Samo administratori mogu pristupiti ovom ekranu."}
            />
          ) : (
            <>
              <View style={styles.tabs}>
                <TouchableOpacity
                  style={[styles.tab, activeTab === 'photo' && styles.tabActive]}
                  onPress={() => setActiveTab('photo')}
                >
                  <Camera size={16} color={activeTab === 'photo' ? colors.softGreen : colors.muted} />
                  <Text style={[styles.tabText, activeTab === 'photo' && styles.tabTextActive]}>
                    {"Foto"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, activeTab === 'group' && styles.tabActive]}
                  onPress={() => setActiveTab('group')}
                >
                  <Users size={16} color={activeTab === 'group' ? colors.softGreen : colors.muted} />
                  <Text style={[styles.tabText, activeTab === 'group' && styles.tabTextActive]}>
                    {"Grupe"}
                  </Text>
                </TouchableOpacity>
              </View>

              {loading ? <Text style={styles.muted}>{"U\u010ditavanje..."}</Text> : null}

              {activeTab === 'photo' && (
                <View style={styles.section}>
                  {photoCards.length === 0 && !loading ? (
                    <EmptyState
                      title={"Nema foto prijava"}
                      description={"Trenutno nema foto prijava."}
                    />
                  ) : (
                    photoCards.map((item) => {
                      const challenge = photoChallenges[item.photo_challenge_id];
                      const user = profiles[item.user_id];
                      return (
                        <GlowCard key={`photo-${item.id}`} style={styles.cardShell} contentStyle={styles.card}>
                          {item.image_url ? (
                            <Image source={{ uri: item.image_url }} style={styles.preview} />
                          ) : null}
                          <View style={styles.cardBody}>
                            <Text style={styles.cardTitle}>
                              {challenge?.title ?? "Foto izazov"}
                            </Text>
                            <Text style={styles.cardMeta}>
                              {"Korisnik"}: {user?.korisnicko_ime ?? "Korisnik"}
                            </Text>
                            {item.description ? (
                              <Text style={styles.cardMeta}>
                                {"Opis"}: {item.description}
                              </Text>
                            ) : null}
                            {item.location ? (
                              <Text style={styles.cardMeta}>
                                {"Lokacija"}: {item.location}
                              </Text>
                            ) : null}
                            <Text style={styles.points}>
                              +{challenge?.points ?? 0} {"poena"}
                            </Text>
                            <View style={styles.actions}>
                              <TouchableOpacity onPress={() => approvePhoto(item)}>
                                <LinearGradient colors={gradients.primary} style={styles.actionButton}>
                                  <CheckCircle2 size={16} color={colors.text} />
                                  <Text style={styles.actionText}>{"Odobri"}</Text>
                                </LinearGradient>
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => rejectPhoto(item)} style={styles.rejectButton}>
                                <XCircle size={16} color={colors.danger} />
                                <Text style={styles.rejectText}>{"Odbij"}</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </GlowCard>
                      );
                    })
                  )}
                </View>
              )}

              {activeTab === 'group' && (
                <View style={styles.section}>
                  {groupCards.length === 0 && !loading ? (
                    <EmptyState
                      title={"Nema grupnih prijava"}
                      description={"Trenutno nema grupnih prijava."}
                    />
                  ) : (
                    groupCards.map((item) => {
                      const activity = groupActivities[item.activity_id];
                      const group = groups[item.group_id];
                      const user = profiles[item.user_id];
                      return (
                        <GlowCard key={`group-${item.id}`} style={styles.cardShell} contentStyle={styles.card}>
                          {item.image_url ? (
                            <Image source={{ uri: item.image_url }} style={styles.preview} />
                          ) : null}
                          <View style={styles.cardBody}>
                            <Text style={styles.cardTitle}>
                              {activity?.title ?? "Aktivnost"}
                            </Text>
                            <Text style={styles.cardMeta}>
                              {"Grupa"}: {group?.name ?? "Grupa"}
                            </Text>
                            <Text style={styles.cardMeta}>
                              {"Korisnik"}: {user?.korisnicko_ime ?? "Korisnik"}
                            </Text>
                            {item.description ? (
                              <Text style={styles.cardMeta}>
                                {"Opis"}: {item.description}
                              </Text>
                            ) : null}
                            {item.location ? (
                              <Text style={styles.cardMeta}>
                                {"Lokacija"}: {item.location}
                              </Text>
                            ) : null}
                            <Text style={styles.points}>
                              +{activity?.points ?? 0} {"poena"}
                            </Text>
                            <View style={styles.actions}>
                              <TouchableOpacity onPress={() => approveGroup(item)}>
                                <LinearGradient colors={gradients.primary} style={styles.actionButton}>
                                  <CheckCircle2 size={16} color={colors.text} />
                                  <Text style={styles.actionText}>{"Odobri"}</Text>
                                </LinearGradient>
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => rejectGroup(item)} style={styles.rejectButton}>
                                <XCircle size={16} color={colors.danger} />
                                <Text style={styles.rejectText}>{"Odbij"}</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </GlowCard>
                      );
                    })
                  )}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </ScreenFade>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
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
  tabs: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.4)',
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
  cardShell: {
    marginBottom: spacing.md,
  },
  card: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  preview: {
    width: '100%',
    height: 180,
  },
  cardBody: {
    padding: spacing.md,
  },
  cardTitle: {
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  cardMeta: {
    color: colors.muted,
    marginBottom: spacing.xs,
    fontSize: 12,
  },
  points: {
    color: colors.softGreen,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.md,
  },
  actionText: {
    color: colors.text,
    fontWeight: '600',
  },
  rejectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  rejectText: {
    color: colors.danger,
    fontWeight: '600',
  },
  muted: {
    color: colors.muted,
  },
});
