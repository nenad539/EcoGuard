import React, { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  Text,
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
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
import { GlowCard } from '../components/common/GlowCard';
import { useLanguage } from '../lib/language';

const GROUPS_TABLE = 'groups';
const GROUP_MEMBERS_TABLE = 'group_members';
const GROUP_ACTIVITIES_TABLE = 'group_activities';
const GROUP_MESSAGES_TABLE = 'group_messages';
const GROUP_SUBMISSIONS_TABLE = 'group_activity_submissions';
const FRIENDS_TABLE = 'prijatelji';
const NOTIFICATIONS_TABLE = 'notifications';
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
  goal_value?: number | null;
  goal_unit?: string | null;
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
  const groupId = String(route.params?.groupId ?? '');
  const realtimeConnected = useRealtimeStatus();
  const { t } = useLanguage();

  const [userId, setUserId] = useState<string | null>(null);
  const [profileName, setProfileName] = useState('');
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [inviteCandidates, setInviteCandidates] = useState<GroupMember[]>([]);
  const [invitingIds, setInvitingIds] = useState<Record<string, boolean>>({});
  const [activities, setActivities] = useState<GroupActivity[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, Submission>>({});
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [namesById, setNamesById] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<TabKey>('members');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [chatText, setChatText] = useState('');
  const [activeActivity, setActiveActivity] = useState<GroupActivity | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [messagePage, setMessagePage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);

  const loadUser = async () => {
    const { data } = await supabase.auth.getUser();
    const uid = data?.user?.id ?? null;
    setUserId(uid);
    if (!uid) return;
    const { data: profile } = await supabase
      .from('korisnik_profil')
      .select('korisnicko_ime')
      .eq('id', uid)
      .maybeSingle();
    if (profile?.korisnicko_ime) {
      setProfileName(profile.korisnicko_ime);
    }
  };

  const loadGroup = async () => {
    if (!groupId) {
      setLoadError(t('groupsUnavailableError'));
      return;
    }
    const { data, error } = await supabase
      .from(GROUPS_TABLE)
      .select('id, name, description')
      .eq('id', groupId)
      .maybeSingle();
    if (error?.code === '42703') {
      const { data: fallback } = await supabase
        .from(GROUPS_TABLE)
        .select('id, title, description')
        .eq('id', groupId)
        .maybeSingle();
      if (fallback) {
        setGroup({
          id: fallback.id,
          name: fallback.title ?? t('groupsFallbackName'),
          description: fallback.description ?? null,
        });
        setLoadError(null);
      }
      setLoadError(t('groupLoadError'));
      return;
    }
    if (error) {
      setLoadError(t('groupLoadError'));
      return;
    }
    if (data) {
      setGroup(data as Group);
      setLoadError(null);
    } else {
      setLoadError(t('groupNotFoundError'));
    }
  };

  const loadMembers = async () => {
    const { data, error } = await supabase
      .from(GROUP_MEMBERS_TABLE)
      .select('user_id, korisnik_profil (id, korisnicko_ime, ukupno_poena, trenutni_bedz)')
      .eq('group_id', groupId);

    if (error) {
      const { data: ids, error: idError } = await supabase
        .from(GROUP_MEMBERS_TABLE)
        .select('user_id')
        .eq('group_id', groupId);
      if (idError) {
        console.error('Load members error', error);
        return;
      }
      const memberIds = (ids ?? []).map((row: any) => row.user_id).filter(Boolean);
      if (!memberIds.length) {
        setMembers([]);
        setIsMember(false);
        return;
      }
      const { data: profiles } = await supabase
        .from('korisnik_profil')
        .select('id, korisnicko_ime, ukupno_poena, trenutni_bedz')
        .in('id', memberIds);
      const fallbackMembers = (profiles ?? []) as GroupMember[];
      setMembers(fallbackMembers);
      if (userId) {
        setIsMember(fallbackMembers.some((member) => member.id === userId));
      }
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
      .select('id, title, description, points, goal_value, goal_unit, created_at')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });

    if (error?.code === '42703') {
      const { data: fallback, error: fallbackError } = await supabase
        .from(GROUP_ACTIVITIES_TABLE)
        .select('id, title, description, points, created_at')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });
      if (fallbackError) {
        console.error('Load activities error', fallbackError);
        return;
      }
      setActivities((fallback ?? []) as GroupActivity[]);
      return;
    }

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

  const loadInviteCandidates = async () => {
    if (!userId) return;
    const { data: links } = await supabase
      .from(FRIENDS_TABLE)
      .select('korisnik_od, korisnik_do, status')
      .or(`korisnik_od.eq.${userId},korisnik_do.eq.${userId}`)
      .eq('status', 'accepted');

    const friendIds = (links ?? [])
      .map((link: any) => (link.korisnik_od === userId ? link.korisnik_do : link.korisnik_od))
      .filter(Boolean);

    if (!friendIds.length) {
      setInviteCandidates([]);
      return;
    }

    const { data: profiles } = await supabase
      .from('korisnik_profil')
      .select('id, korisnicko_ime, ukupno_poena, trenutni_bedz')
      .in('id', friendIds);

    const memberIds = new Set(members.map((member) => member.id));
    const candidates = (profiles ?? []).filter((profile) => !memberIds.has(profile.id));
    setInviteCandidates(candidates as GroupMember[]);
  };

  const inviteFriend = async (friendId: string) => {
    if (!group) return;
    setInvitingIds((prev) => ({ ...prev, [friendId]: true }));
    const { error } = await supabase.from(NOTIFICATIONS_TABLE).insert({
      korisnik_id: friendId,
      title: t('notificationGroupInviteTitle'),
      body: t('notificationGroupInviteBody')
        .replace('{name}', profileName || t('defaultUserLabel'))
        .replace('{group}', group.name ?? t('groupsFallbackName')),
      type: 'group_invite',
      related_id: groupId,
      status: 'unread',
    });

    if (error) {
      showError("Gre\u0161ka", t('groupInviteSendError'));
    } else {
      showSuccess("Uspjeh", t('groupInviteSendSuccess'));
      setInviteCandidates((prev) => prev.filter((candidate) => candidate.id !== friendId));
    }
    setInvitingIds((prev) => {
      const next = { ...prev };
      delete next[friendId];
      return next;
    });
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
      showError("Gre\u0161ka", "Ne mo\u017eemo se pridru\u017eiti grupi.");
      return;
    }
    showSuccess("Uspjeh", "Pridru\u017eili ste se grupi.");
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
      showError("Gre\u0161ka", t('groupChatSendError'));
      setMessages((prev) => prev.filter((msg) => msg.id !== optimistic.id));
      setChatText(content);
    }
  };

  const handleSubmitActivity = async (
    submission: { challengeId: number; photoUri: string; description: string; location?: string },
    onProgress?: (value: number) => void
  ): Promise<{ success: boolean; error?: string }> => {
    if (!userId) return { success: false, error: t('groupSubmissionLoginRequired') };

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
      showSuccess("Poslato", t('groupSubmissionSuccess'));
      return { success: true };
    } catch (err: any) {
      setSubmissions((prev) => {
        const next = { ...prev };
        delete next[submission.challengeId];
        return next;
      });
      showError("Gre\u0161ka", t('groupSubmissionError'));
      return { success: false, error: err?.message ?? t('groupSubmissionError') };
    }
  };

  useEffect(() => {
    loadUser();
    loadGroup();
  }, [groupId]);

  useEffect(() => {
    if (!userId || !groupId) return;
    const init = async () => {
      setLoading(true);
      await Promise.all([loadMembers(), loadActivities(), loadSubmissions(), loadMessages(messagePage)]);
      setLoading(false);
    };
    init();
  }, [userId, groupId]);

  useEffect(() => {
    if (!groupId) return;
    loadMessages(messagePage);
  }, [messagePage, groupId]);

  useEffect(() => {
    setMessagePage(1);
  }, [groupId]);

  useEffect(() => {
    if (!userId) return;
    loadInviteCandidates();
  }, [userId, members]);

  useEffect(() => {
    if (!groupId) return;
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
  const badgeLabel = (badge: 'gold' | 'silver' | 'bronze') => {
    if (badge === 'gold') return "Gold";
    if (badge === 'silver') return "Silver";
    return "Bronze";
  };

  return (
    <GradientBackground>
      <ScreenFade>
        <KeyboardAvoidingView
          style={styles.keyboard}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
        >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <BackButton onPress={() => navigation.goBack()} />
          <View style={styles.header}>
            <Text style={styles.title}>{group?.name ?? t('groupsFallbackName')}</Text>
            {group?.description ? <Text style={styles.subtitle}>{group.description}</Text> : null}
            {!isMember ? (
              <TouchableOpacity onPress={joinGroup}>
                <LinearGradient colors={gradients.primary} style={styles.joinButton}>
                  <Text style={styles.joinLabel}>{"Pridru\u017ei se"}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.tabs}>
            {([
              { key: 'members', label: t('groupTabMembers'), icon: Users },
              { key: 'activities', label: t('groupTabActivities'), icon: Camera },
              { key: 'chat', label: t('groupTabChat'), icon: MessageCircle },
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

          {loadError ? <Text style={styles.error}>{loadError}</Text> : null}
          {loading ? <Text style={styles.muted}>{"U\u010ditavanje..."}</Text> : null}

          {activeTab === 'members' && (
            <View style={styles.section}>
              {isMember ? (
                <GlowCard style={styles.cardShell} contentStyle={styles.inviteCard}>
                  <Text style={styles.sectionTitle}>{t('groupInviteTitle')}</Text>
                  {inviteCandidates.length === 0 ? (
                    <Text style={styles.muted}>{t('groupInviteEmpty')}</Text>
                  ) : (
                    inviteCandidates.map((candidate) => (
                      <View key={candidate.id} style={styles.inviteRow}>
                        <View>
                          <Text style={styles.cardTitle}>{candidate.korisnicko_ime}</Text>
                          <Text style={styles.cardSubtitle}>
                            {"Poeni"}: {candidate.ukupno_poena ?? 0}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => inviteFriend(candidate.id)}
                          disabled={invitingIds[candidate.id]}
                        >
                          <LinearGradient colors={gradients.primary} style={styles.inviteButton}>
                            <Text style={styles.inviteLabel}>
                              {invitingIds[candidate.id] ? t('sendingLabel') : t('groupInviteButtonLabel')}
                            </Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                    ))
                  )}
                </GlowCard>
              ) : null}
              {members.length === 0 ? (
                <EmptyState
                  title={t('groupMembersEmptyTitle')}
                  description={t('groupMembersEmptyDesc')}
                />
              ) : (
                members.map((member) => (
                  <GlowCard key={member.id} style={styles.cardShell} contentStyle={styles.card}>
                    <View>
                      <Text style={styles.cardTitle}>{member.korisnicko_ime}</Text>
                      <Text style={styles.cardSubtitle}>
                        {"Poeni"}: {member.ukupno_poena ?? 0}
                      </Text>
                    </View>
                    <Text style={styles.badgeText}>
                      {badgeLabel((member.trenutni_bedz ?? 'bronze') as 'gold' | 'silver' | 'bronze')}
                    </Text>
                  </GlowCard>
                ))
              )}
            </View>
          )}

          {activeTab === 'activities' && (
            <View style={styles.section}>
              {activityCards.length === 0 ? (
                <EmptyState
                  title={t('groupActivitiesEmptyTitle')}
                  description={t('groupActivitiesEmptyDesc')}
                />
              ) : (
                activityCards.map((activity) => (
                  <GlowCard key={activity.id} style={styles.cardShell} contentStyle={styles.card}>
                    <View style={styles.cardText}>
                      <Text style={styles.cardTitle}>{activity.title}</Text>
                      {activity.description ? (
                        <Text style={styles.cardSubtitle}>{activity.description}</Text>
                      ) : null}
                      {activity.goal_value ? (
                        <Text style={styles.cardSubtitle}>
                          {t('groupActivityGoalLabel')}: {activity.goal_value} {activity.goal_unit ?? ''}
                        </Text>
                      ) : null}
                      {activity.points ? (
                        <Text style={styles.points}>
                          +{activity.points} {"poena"}
                        </Text>
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
                            ? t('groupActivityStatusApproved')
                            : activity.status === 'pending'
                            ? t('groupActivityStatusPending')
                            : t('groupActivitySendPhotoLabel')}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </GlowCard>
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
                      title={t('groupChatEmptyTitle')}
                      description={t('groupChatEmptyDesc')}
                    />
                  ) : null}
                  {hasMoreMessages ? (
                    <TouchableOpacity
                      onPress={() => setMessagePage((prev) => prev + 1)}
                      style={styles.loadMore}
                    >
                      <Text style={styles.loadMoreText}>{t('groupChatLoadMoreLabel')}</Text>
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
                        <Text style={styles.bubbleName}>{namesById[msg.user_id] ?? t('defaultUserLabel')}</Text>
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
                  placeholder={t('groupChatPlaceholder')}
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
        </KeyboardAvoidingView>
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
  keyboard: {
    flex: 1,
  },
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
  error: {
    color: colors.danger,
    marginBottom: spacing.sm,
  },
  card: {
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inviteCard: {
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardShell: {
    marginBottom: spacing.sm,
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
  sectionTitle: {
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  inviteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  inviteButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.lg,
  },
  inviteLabel: {
    color: colors.text,
    fontWeight: '600',
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
