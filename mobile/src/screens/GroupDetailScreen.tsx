import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, StyleSheet, View, TextInput, TouchableOpacity } from 'react-native';
import { Camera, MessageCircle, Users, Send } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { supabase } from '../lib/supabase';
import { useRealtimeStatus } from '../lib/realtime';
import { uploadPhotoChallenge } from '../lib/uploads';
import { showError, showSuccess } from '../lib/toast';
import { colors, radius, spacing, gradients } from '../styles/common';
import { GradientBackground } from '../components/common/GradientBackground';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenFade } from '../components/common/ScreenFade';
import { BackButton } from '../components/common/BackButton';
import { PhotoSubmission } from '../components/PhotoSubmission';
import { EmptyState } from '../components/common/EmptyState';

const GROUPS_TABLE = 'groups';
const GROUP_MEMBERS_TABLE = 'group_members';
const GROUP_ACTIVITIES_TABLE = 'group_activities';
const GROUP_MESSAGES_TABLE = 'group_messages';
const GROUP_SUBMISSIONS_TABLE = 'group_activity_submissions';
const PAGE_SIZE = 30;

type Group = {
  id: string;
  name: string;
  description: string | null;
};

type GroupMember = {
  id: string;
  korisnicko_ime: string;
  ukupno_poena?: number | null;
  trenutni_bedz?: 'gold' | 'silver' | 'bronze' | null;
};

type GroupActivity = {
  id: string;
  title: string;
  description: string | null;
  points: number | null;
  created_at: string | null;
};

type GroupMessage = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
};

type Submission = {
  activity_id: string;
  approved: boolean;
  submitted_at: string | null;
  image_url: string | null;
};

type TabKey = 'members' | 'activities' | 'chat';

export function GroupDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'GroupDetail'>>();
  const { groupId } = route.params;
  const realtimeConnected = useRealtimeStatus();

  const [userId, setUserId] = useState<string | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [activities, setActivities] = useState<GroupActivity[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, Submission>>({});
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [namesById, setNamesById] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<TabKey>('members');
  const [loading, setLoading] = useState(true);
  const [chatText, setChatText] = useState('');
  const [activeActivity, setActiveActivity] = useState<GroupActivity | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [messagePage, setMessagePage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);

  const loadUser = async () => {
    const { data } = await supabase.auth.getUser();
    setUserId(data?.user?.id ?? null);
  };

  const loadGroup = async () => {
    const { data } = await supabase
      .from(GROUPS_TABLE)
      .select('id, name, description')
      .eq('id', groupId)
      .maybeSingle();
    if (data) setGroup(data as Group);
  };

  const loadMembers = async () => {
    const { data, error } = await supabase
      .from(GROUP_MEMBERS_TABLE)
      .select('user_id, korisnik_profil (id, korisnicko_ime, ukupno_poena, trenutni_bedz)')
      .eq('group_id', groupId);

    if (error) {
      console.error('Load members error', error);
      return;
    }

    const rows = (data ?? []) as any[];
    const mapped = rows
      .map((row) => row.korisnik_profil)
      .filter(Boolean)
      .map((profile: any) => ({
        id: profile.id,
        korisnicko_ime: profile.korisnicko_ime,
        ukupno_poena: profile.ukupno_poena,
        trenutni_bedz: profile.trenutni_bedz,
      }));

    setMembers(mapped);
    if (userId) {
      setIsMember(mapped.some((member) => member.id === userId));
    }
  };

  const loadActivities = async () => {
    const { data, error } = await supabase
      .from(GROUP_ACTIVITIES_TABLE)
      .select('id, title, description, points, created_at')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Load activities error', error);
      return;
    }

    setActivities((data ?? []) as GroupActivity[]);
  };

  const loadSubmissions = async () => {
    if (!userId) return;
    const { data } = await supabase
      .from(GROUP_SUBMISSIONS_TABLE)
      .select('activity_id, approved, submitted_at, image_url')
      .eq('group_id', groupId)
      .eq('user_id', userId);

    const map = (data ?? []).reduce<Record<string, Submission>>((acc, item: any) => {
      acc[item.activity_id] = {
        activity_id: item.activity_id,
        approved: Boolean(item.approved),
        submitted_at: item.submitted_at,
        image_url: item.image_url,
      };
      return acc;
    }, {});

    setSubmissions(map);
  };

  const loadMessages = async (pageNumber = 1) => {
    const limit = pageNumber * PAGE_SIZE;
    const { data, count } = await supabase
      .from(GROUP_MESSAGES_TABLE)
      .select('id, user_id, content, created_at', { count: 'exact' })
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
      .range(0, Math.max(0, limit - 1));

    const rows = [...(data ?? [])].reverse() as GroupMessage[];
    setMessages(rows);
    setHasMoreMessages(Boolean(count && count > limit));

    const userIds = Array.from(new Set(rows.map((row) => row.user_id)));
    if (userIds.length) {
      const { data: profiles } = await supabase
        .from('korisnik_profil')
        .select('id, korisnicko_ime')
        .in('id', userIds);
      const map = (profiles ?? []).reduce<Record<string, string>>((acc, profile) => {
        acc[profile.id] = profile.korisnicko_ime;
        return acc;
      }, {});
      setNamesById(map);
    }
  };

  const joinGroup = async () => {
    if (!userId) return;
    const { error } = await supabase.from(GROUP_MEMBERS_TABLE).insert({
      group_id: groupId,
      user_id: userId,
      role: 'member',
    });
    if (error) {
      showError('Greška', 'Ne možemo se pridružiti grupi.');
      return;
    }
    showSuccess('Uspjeh', 'Pridružili ste se grupi.');
    await loadMembers();
  };

  const sendMessage = async () => {
    if (!userId || !chatText.trim()) return;
    const content = chatText.trim();
    const optimistic: GroupMessage = {
      id: `temp-${Date.now()}`,
      user_id: userId,
      content,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setChatText('');

    const { error } = await supabase.from(GROUP_MESSAGES_TABLE).insert({
      group_id: groupId,
      user_id: userId,
      content,
    });

    if (error) {
      showError('Greška', 'Ne možemo poslati poruku.');
      setMessages((prev) => prev.filter((msg) => msg.id !== optimistic.id));
      setChatText(content);
    }
  };

  const handleSubmitActivity = async (
    submission: { challengeId: number; photoUri: string; description: string; location?: string },
    onProgress?: (value: number) => void
  ): Promise<{ success: boolean; error?: string }> => {
    if (!userId) return { success: false, error: 'Morate biti prijavljeni.' };

    try {
      const optimistic: Submission = {
        activity_id: String(submission.challengeId),
        approved: false,
        submitted_at: new Date().toISOString(),
        image_url: null,
      };
      setSubmissions((prev) => ({ ...prev, [submission.challengeId]: optimistic }));

      const { publicUrl } = await uploadPhotoChallenge({
        uri: submission.photoUri,
        userId,
        challengeId: submission.challengeId,
        onProgress,
      });

      const { error } = await supabase.from(GROUP_SUBMISSIONS_TABLE).insert({
        activity_id: submission.challengeId,
        group_id: groupId,
        user_id: userId,
        image_url: publicUrl,
        description: submission.description ?? null,
        submitted_at: new Date().toISOString(),
        approved: false,
      });

      if (error) throw error;

      await loadSubmissions();
      setActiveActivity(null);
      showSuccess('Poslato', 'Fotografija je poslata na provjeru.');
      return { success: true };
    } catch (err: any) {
      setSubmissions((prev) => {
        const next = { ...prev };
        delete next[submission.challengeId];
        return next;
      });
      showError('Greška', 'Ne možemo poslati fotografiju.');
      return { success: false, error: err?.message ?? 'Greška pri slanju.' };
    }
  };

  useEffect(() => {
    loadUser();
    loadGroup();
  }, []);

  useEffect(() => {
    if (!userId) return;
    const init = async () => {
      setLoading(true);
      await Promise.all([loadMembers(), loadActivities(), loadSubmissions(), loadMessages(messagePage)]);
      setLoading(false);
    };
    init();
  }, [userId, groupId]);

  useEffect(() => {
    loadMessages(messagePage);
  }, [messagePage]);

  useEffect(() => {
    setMessagePage(1);
  }, [groupId]);

  useEffect(() => {
    const membersChannel = supabase
      .channel('group-members')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: GROUP_MEMBERS_TABLE, filter: `group_id=eq.${groupId}` },
        () => loadMembers()
      )
      .subscribe();

    const activitiesChannel = supabase
      .channel('group-activities')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: GROUP_ACTIVITIES_TABLE, filter: `group_id=eq.${groupId}` },
        () => loadActivities()
      )
      .subscribe();

    const submissionsChannel = supabase
      .channel('group-submissions')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: GROUP_SUBMISSIONS_TABLE, filter: `group_id=eq.${groupId}` },
        () => loadSubmissions()
      )
      .subscribe();

    const messagesChannel = supabase
      .channel('group-messages')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: GROUP_MESSAGES_TABLE, filter: `group_id=eq.${groupId}` },
        () => loadMessages(messagePage)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(membersChannel);
      supabase.removeChannel(activitiesChannel);
      supabase.removeChannel(submissionsChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [groupId, userId]);

  useEffect(() => {
    if (realtimeConnected) return;
    const interval = setInterval(() => {
      loadMembers();
      loadActivities();
      loadSubmissions();
      loadMessages(messagePage);
    }, 20000);
    return () => clearInterval(interval);
  }, [realtimeConnected, groupId, userId, messagePage]);

  const activityCards = useMemo(() => {
    return activities.map((activity) => {
      const submission = submissions[activity.id];
      let status: 'available' | 'pending' | 'approved' = 'available';
      if (submission) {
        status = submission.approved ? 'approved' : 'pending';
      }
      return { ...activity, status };
    });
  }, [activities, submissions]);

  return (
    <GradientBackground>
      <ScreenFade>
        <ScrollView contentContainerStyle={styles.container}>
          <BackButton onPress={() => navigation.goBack()} />
          <View style={styles.header}>
            <Text style={styles.title}>{group?.name ?? 'Grupa'}</Text>
            {group?.description ? <Text style={styles.subtitle}>{group.description}</Text> : null}
            {!isMember ? (
              <TouchableOpacity onPress={joinGroup}>
                <LinearGradient colors={gradients.primary} style={styles.joinButton}>
                  <Text style={styles.joinLabel}>Pridruži se</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.tabs}>
            {([
              { key: 'members', label: 'Članovi', icon: Users },
              { key: 'activities', label: 'Aktivnosti', icon: Camera },
              { key: 'chat', label: 'Chat', icon: MessageCircle },
            ] as const).map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                <tab.icon size={16} color={activeTab === tab.key ? colors.softGreen : colors.muted} />
                <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {loading ? <Text style={styles.muted}>Učitavanje...</Text> : null}

          {activeTab === 'members' && (
            <View style={styles.section}>
              {members.length === 0 ? (
                <EmptyState
                  title="Nema članova"
                  description="Budite prvi koji će se pridružiti ovoj grupi."
                />
              ) : (
                members.map((member) => (
                  <View key={member.id} style={styles.card}>
                    <View>
                      <Text style={styles.cardTitle}>{member.korisnicko_ime}</Text>
                      <Text style={styles.cardSubtitle}>Poeni: {member.ukupno_poena ?? 0}</Text>
                    </View>
                    <Text style={styles.badgeText}>{member.trenutni_bedz ?? 'bronze'}</Text>
                  </View>
                ))
              )}
            </View>
          )}

          {activeTab === 'activities' && (
            <View style={styles.section}>
              {activityCards.length === 0 ? (
                <EmptyState
                  title="Nema aktivnosti"
                  description="Dodajte aktivnost da pokrenete grupu."
                />
              ) : (
                activityCards.map((activity) => (
                  <View key={activity.id} style={styles.card}>
                    <View style={styles.cardText}>
                      <Text style={styles.cardTitle}>{activity.title}</Text>
                      {activity.description ? (
                        <Text style={styles.cardSubtitle}>{activity.description}</Text>
                      ) : null}
                      {activity.points ? (
                        <Text style={styles.points}>+{activity.points} poena</Text>
                      ) : null}
                    </View>
                    <TouchableOpacity
                      onPress={() => setActiveActivity(activity)}
                      disabled={!isMember || activity.status !== 'available'}
                    >
                      <LinearGradient
                        colors={gradients.primary}
                        style={[
                          styles.actionButton,
                          (!isMember || activity.status !== 'available') && styles.actionDisabled,
                        ]}
                      >
                        <Text style={styles.actionLabel}>
                          {activity.status === 'approved'
                            ? 'Odobreno'
                            : activity.status === 'pending'
                            ? 'Na čekanju'
                            : 'Pošalji foto'}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          )}

          {activeTab === 'chat' && (
            <View style={styles.section}>
              <View style={styles.chatBox}>
                <ScrollView contentContainerStyle={styles.chatMessages} nestedScrollEnabled>
                  {messages.length === 0 ? (
                    <EmptyState
                      title="Još nema poruka"
                      description="Započnite razgovor u grupi."
                    />
                  ) : null}
                  {hasMoreMessages ? (
                    <TouchableOpacity
                      onPress={() => setMessagePage((prev) => prev + 1)}
                      style={styles.loadMore}
                    >
                      <Text style={styles.loadMoreText}>Učitaj starije</Text>
                    </TouchableOpacity>
                  ) : null}
                  {messages.map((msg) => {
                    const isOwn = msg.user_id === userId;
                    const timeLabel = msg.created_at ? new Date(msg.created_at).toLocaleTimeString() : '';
                    if (isOwn) {
                      return (
                        <LinearGradient
                          key={msg.id}
                          colors={gradients.primary}
                          style={[styles.bubble, styles.bubbleOwn]}
                        >
                          <Text style={styles.bubbleText}>{msg.content}</Text>
                          <Text style={styles.bubbleTime}>{timeLabel}</Text>
                        </LinearGradient>
                      );
                    }
                    return (
                      <View key={msg.id} style={[styles.bubble, styles.bubbleOther]}>
                        <Text style={styles.bubbleName}>{namesById[msg.user_id] ?? 'Korisnik'}</Text>
                        <Text style={styles.bubbleText}>{msg.content}</Text>
                        <Text style={styles.bubbleTime}>{timeLabel}</Text>
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
              <View style={styles.inputRow}>
                <TextInput
                  value={chatText}
                  onChangeText={setChatText}
                  placeholder="Napiši poruku..."
                  placeholderTextColor={colors.muted}
                  style={styles.input}
                />
                <TouchableOpacity onPress={sendMessage}>
                  <LinearGradient colors={gradients.primary} style={styles.sendButton}>
                    <Send size={16} color={colors.text} />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </ScreenFade>

      {activeActivity ? (
        <PhotoSubmission
          visible={Boolean(activeActivity)}
          challengeId={Number(activeActivity.id)}
          challengeTitle={activeActivity.title}
          challengePoints={activeActivity.points ?? 0}
          onSubmit={handleSubmitActivity}
          onCancel={() => setActiveActivity(null)}
        />
      ) : null}
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '600',
  },
  subtitle: {
    color: colors.muted,
    marginTop: spacing.xs,
  },
  joinButton: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: radius.md,
  },
  joinLabel: {
    color: colors.text,
    fontWeight: '600',
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
  muted: {
    color: colors.muted,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardText: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  cardTitle: {
    color: colors.text,
    fontWeight: '600',
  },
  cardSubtitle: {
    color: colors.muted,
    marginTop: spacing.xs,
    fontSize: 12,
  },
  badgeText: {
    color: colors.primary,
    fontWeight: '600',
  },
  points: {
    color: colors.softGreen,
    marginTop: spacing.xs,
    fontSize: 12,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.md,
  },
  actionDisabled: {
    opacity: 0.6,
  },
  actionLabel: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 12,
  },
  chatBox: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.4)',
    maxHeight: 380,
  },
  chatMessages: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  bubble: {
    maxWidth: '85%',
    padding: spacing.sm,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  bubbleOwn: {
    alignSelf: 'flex-end',
  },
  bubbleOther: {
    alignSelf: 'flex-start',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bubbleName: {
    color: colors.softGreen,
    fontSize: 11,
    marginBottom: spacing.xs,
  },
  bubbleText: {
    color: colors.text,
  },
  bubbleTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
    marginTop: spacing.xs,
    textAlign: 'right',
  },
  loadMore: {
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.35)',
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
  },
  loadMoreText: {
    color: colors.softGreen,
    fontWeight: '600',
    fontSize: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.cardAlt,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
  },
  sendButton: {
    padding: 12,
    borderRadius: radius.md,
  },
});
