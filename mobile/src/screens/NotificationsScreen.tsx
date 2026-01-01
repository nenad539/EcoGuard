import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, StyleSheet, View, TouchableOpacity } from 'react-native';
import { Bell, CheckCircle, Trash2, UserPlus, Users } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { getCached, setCached } from '../lib/cache';
import { useRealtimeStatus } from '../lib/realtime';
import { showError, showSuccess } from '../lib/toast';
import { colors, gradients, radius, spacing } from '../styles/common';
import { GradientBackground } from '../components/common/GradientBackground';
import { SkeletonBlock } from '../components/common/Skeleton';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenFade } from '../components/common/ScreenFade';
import { BackButton } from '../components/common/BackButton';
import { EmptyState } from '../components/common/EmptyState';
import { GlowCard } from '../components/common/GlowCard';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useLanguage } from '../lib/language';

const NOTIFICATIONS_TABLE = 'notifications';
const FRIENDS_TABLE = 'prijatelji';
const GROUP_MEMBERS_TABLE = 'group_members';
const CACHE_TTL = 1000 * 60 * 5;

type NotificationItem = {
  id: string;
  title: string | null;
  body: string | null;
  type: string | null;
  related_id: string | null;
  status: string | null;
  created_at: string | null;
};

export function NotificationsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const realtimeConnected = useRealtimeStatus();
  const { t } = useLanguage();
  const [userId, setUserId] = useState<string | null>(null);
  const [profileName, setProfileName] = useState('');
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [usingCache, setUsingCache] = useState(false);

  const loadNotifications = async () => {
    if (!userId) return;

    const { data, error } = await supabase
      .from(NOTIFICATIONS_TABLE)
      .select('id, title, body, type, related_id, status, created_at')
      .eq('korisnik_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      setError(t('notificationsLoadError'));
      showError("Gre\u0161ka", t('notificationsLoadErrorToast'));
      setLoading(false);
      return;
    }

    setItems((data ?? []) as NotificationItem[]);
    setCached(`notifications:${userId}`, (data ?? []) as NotificationItem[]);
    setUsingCache(false);
    setLoading(false);
  };

  useEffect(() => {
    const loadUser = async () => {
      const { data: auth } = await supabase.auth.getUser();
      setUserId(auth?.user?.id ?? null);
    };
    loadUser();
  }, []);

  useEffect(() => {
    if (!userId) return;
    loadNotifications();
    const loadProfile = async () => {
      const { data } = await supabase
        .from('korisnik_profil')
        .select('korisnicko_ime')
        .eq('id', userId)
        .maybeSingle();
      if (data?.korisnicko_ime) setProfileName(data.korisnicko_ime);
    };
    loadProfile();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const loadCache = async () => {
      const cached = await getCached<NotificationItem[]>(`notifications:${userId}`, CACHE_TTL);
      if (cached?.value?.length) {
        setItems(cached.value);
        setUsingCache(cached.isStale);
        setLoading(false);
      }
    };
    loadCache();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: NOTIFICATIONS_TABLE, filter: `korisnik_id=eq.${userId}` },
        () => loadNotifications()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  useEffect(() => {
    if (!userId || realtimeConnected) return;
    const interval = setInterval(() => {
      loadNotifications();
    }, 20000);
    return () => clearInterval(interval);
  }, [userId, realtimeConnected]);

  const markRead = async (id: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status: 'read' } : item)));
    await supabase.from(NOTIFICATIONS_TABLE).update({ status: 'read' }).eq('id', id);
  };

  const markAllRead = async () => {
    if (!userId) return;
    setItems((prev) => prev.map((item) => ({ ...item, status: 'read' })));
    const { error: updateError } = await supabase
      .from(NOTIFICATIONS_TABLE)
      .update({ status: 'read' })
      .eq('korisnik_id', userId)
      .eq('status', 'unread');
    if (updateError) {
      showError("Gre\u0161ka", t('notificationsMarkAllError'));
      return;
    }
    showSuccess("Uspjeh", t('notificationsMarkAllSuccess'));
  };

  const acceptFriendRequest = async (item: NotificationItem) => {
    if (!userId || !item.related_id) return;
    const { data: link, error: linkError } = await supabase
      .from(FRIENDS_TABLE)
      .select('id, korisnik_od, korisnik_do, status')
      .eq('id', item.related_id)
      .maybeSingle();

    if (linkError || !link) {
      showError("Gre\u0161ka", t('notificationsFriendRequestNotFound'));
      return;
    }

    if (link.korisnik_do !== userId) {
      showError("Gre\u0161ka", t('notificationsFriendRequestNoPermission'));
      return;
    }

    if (link.status === 'accepted') {
      await markRead(item.id);
      return;
    }

    const { error: updateError } = await supabase
      .from(FRIENDS_TABLE)
      .update({ status: 'accepted' })
      .eq('id', link.id);

    if (updateError) {
      showError("Gre\u0161ka", t('notificationsFriendRequestAcceptError'));
      return;
    }

    await supabase.from(NOTIFICATIONS_TABLE).insert({
      korisnik_id: link.korisnik_od,
      title: t('notificationFriendAcceptTitle'),
      body: t('notificationFriendAcceptBody').replace('{name}', profileName || t('defaultUserLabel')),
      type: 'friend_accept',
      related_id: link.id,
      status: 'unread',
    });

    await markRead(item.id);
    showSuccess("Uspjeh", t('notificationsFriendRequestAcceptSuccess'));
  };

  const acceptGroupInvite = async (item: NotificationItem) => {
    if (!userId || !item.related_id) return;
    const groupId = item.related_id;

    const { data: existing } = await supabase
      .from(GROUP_MEMBERS_TABLE)
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      await markRead(item.id);
      showSuccess("Uspjeh", t('notificationsGroupAlreadyMember'));
      return;
    }

    const payloads = [
      { group_id: groupId, user_id: userId, role: 'member' },
      { group_id: groupId, user_id: userId },
    ];

    let inserted = false;
    let lastError: any;
    for (const payload of payloads) {
      const { error } = await supabase.from(GROUP_MEMBERS_TABLE).insert(payload);
      if (!error) {
        inserted = true;
        break;
      }
      if (error?.code === '42703') {
        lastError = error;
        continue;
      }
      lastError = error;
    }

    if (!inserted) {
      showError("Gre\u0161ka", lastError?.message ?? t('notificationsGroupAcceptError'));
      return;
    }

    await markRead(item.id);
    showSuccess("Uspjeh", t('notificationsGroupAcceptSuccess'));
  };

  const unreadCount = useMemo(
    () => items.filter((item) => item.status === 'unread').length,
    [items]
  );

  const removeNotification = async (id: string) => {
    const prev = items;
    setItems((current) => current.filter((item) => item.id !== id));
    const { error: deleteError } = await supabase.from(NOTIFICATIONS_TABLE).delete().eq('id', id);
    if (deleteError) {
      setItems(prev);
      showError("Gre\u0161ka", t('notificationsDeleteError'));
    }
  };

  const grouped = useMemo(() => {
    const groups: { label: string; items: NotificationItem[] }[] = [];
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const sevenDaysAgo = new Date(startOfToday);
    sevenDaysAgo.setDate(startOfToday.getDate() - 7);

    const todayItems = items.filter((item) => {
      if (!item.created_at) return false;
      return new Date(item.created_at) >= startOfToday;
    });
    const weekItems = items.filter((item) => {
      if (!item.created_at) return false;
      const date = new Date(item.created_at);
      return date < startOfToday && date >= sevenDaysAgo;
    });
    const olderItems = items.filter((item) => {
      if (!item.created_at) return true;
      return new Date(item.created_at) < sevenDaysAgo;
    });

    if (todayItems.length) groups.push({ label: t('notificationsGroupToday'), items: todayItems });
    if (weekItems.length) groups.push({ label: t('notificationsGroupWeek'), items: weekItems });
    if (olderItems.length) groups.push({ label: t('notificationsGroupEarlier'), items: olderItems });

    return groups;
  }, [items, t]);

  const renderIcon = (type: string | null) => {
    if (type === 'friend_request') return <UserPlus size={18} color={colors.text} />;
    if (type === 'friend_accept') return <CheckCircle size={18} color={colors.text} />;
    if (type === 'group_invite') return <Users size={18} color={colors.text} />;
    return <Bell size={18} color={colors.text} />;
  };

  return (
    <GradientBackground>
      <ScreenFade>
        <ScrollView contentContainerStyle={styles.content}>
          <BackButton onPress={() => navigation.goBack()} />
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <Text style={styles.title}>{t('notificationsTitle')}</Text>
              {unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </View>
            <Text style={styles.subtitle}>
              {unreadCount > 0
                ? t('notificationsUnreadSubtitle').replace('{count}', String(unreadCount))
                : t('notificationsAllReadSubtitle')}
            </Text>
            {unreadCount > 0 && (
              <TouchableOpacity onPress={markAllRead}>
                <LinearGradient colors={gradients.primary} style={styles.headerAction}>
                  <Text style={styles.headerActionText}>{t('notificationsMarkAllLabel')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>

        {error && <Text style={styles.error}>{error}</Text>}
        {usingCache && <Text style={styles.cacheNote}>{"Prikazujem ke\u0161irane podatke."}</Text>}

        {loading && items.length === 0 ? (
          <View style={styles.skeletonWrap}>
            {Array.from({ length: 4 }).map((_, index) => (
              <GlowCard key={`skeleton-${index}`} style={styles.cardShell} contentStyle={styles.card}>
                <View style={styles.cardRow}>
                  <SkeletonBlock width={36} height={36} radiusSize={18} />
                  <View style={styles.cardContent}>
                    <SkeletonBlock width="70%" height={14} />
                    <SkeletonBlock width="90%" height={12} style={{ marginTop: 8 }} />
                    <SkeletonBlock width="40%" height={10} style={{ marginTop: 8 }} />
                  </View>
                </View>
              </GlowCard>
            ))}
          </View>
        ) : items.length === 0 ? (
          <EmptyState
            title={t('notificationsEmptyTitle')}
            description={t('notificationsEmptyDesc')}
          />
        ) : (
          grouped.map((group) => (
            <View key={group.label} style={styles.groupSection}>
              <Text style={styles.groupTitle}>{group.label}</Text>
              {group.items.map((item) => (
                <GlowCard
                  key={item.id}
                  style={styles.cardShell}
                  contentStyle={[
                    styles.card,
                    ...(item.status === 'unread' ? [styles.cardUnread] : []),
                  ]}
                  gradient={
                    item.status === 'unread'
                      ? (['rgba(34, 197, 94, 0.45)', 'rgba(15, 23, 42, 0.95)'] as const)
                      : undefined
                  }
                >
                    <View style={styles.cardRow}>
                    <View style={styles.iconWrap}>{renderIcon(item.type)}</View>
                    <View style={styles.cardContent}>
                      <View style={styles.cardTitleRow}>
                        <Text style={styles.cardTitle}>{item.title ?? t('notificationFallbackTitle')}</Text>
                        {item.status === 'unread' && <View style={styles.unreadDot} />}
                      </View>
                      {item.body ? <Text style={styles.cardBody}>{item.body}</Text> : null}
                      <Text style={styles.cardMeta}>
                        {item.created_at ? new Date(item.created_at).toLocaleString() : ''}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.actions}>
                    {item.type === 'friend_request' && item.related_id ? (
                      <TouchableOpacity onPress={() => acceptFriendRequest(item)}>
                        <LinearGradient colors={gradients.primary} style={styles.primaryButton}>
                          <Text style={styles.primaryLabel}>{"Prihvati"}</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    ) : null}
                    {item.type === 'group_invite' && item.related_id ? (
                      <TouchableOpacity onPress={() => acceptGroupInvite(item)}>
                        <LinearGradient colors={gradients.primary} style={styles.primaryButton}>
                          <Text style={styles.primaryLabel}>{"Pridru\u017ei se"}</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    ) : null}
                    {item.status !== 'read' && (
                      <TouchableOpacity onPress={() => markRead(item.id)} style={styles.secondaryButton}>
                        <Text style={styles.secondaryLabel}>{t('notificationsMarkReadLabel')}</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={() => removeNotification(item.id)} style={styles.iconButton}>
                      <Trash2 color={colors.muted} size={16} />
                    </TouchableOpacity>
                  </View>
                </GlowCard>
              ))}
            </View>
          ))
        )}
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '600',
  },
  subtitle: {
    color: colors.muted,
    marginTop: spacing.xs,
  },
  headerAction: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.lg,
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  headerActionText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 13,
  },
  error: {
    color: colors.danger,
    marginBottom: spacing.sm,
  },
  cacheNote: {
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  muted: {
    color: colors.muted,
  },
  unreadBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  unreadBadgeText: {
    color: colors.softGreen,
    fontWeight: '600',
    fontSize: 12,
  },
  cardShell: {
    marginBottom: spacing.sm,
  },
  card: {
    padding: spacing.md,
  },
  cardUnread: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  groupSection: {
    marginBottom: spacing.md,
  },
  groupTitle: {
    color: colors.muted,
    fontSize: 12,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  cardRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  cardContent: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    color: colors.text,
    fontWeight: '700',
  },
  cardBody: {
    color: colors.muted,
    marginTop: spacing.xs,
  },
  cardMeta: {
    color: colors.muted,
    marginTop: spacing.xs,
    fontSize: 12,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.softGreen,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  primaryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: radius.md,
  },
  primaryLabel: {
    color: colors.text,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
  },
  secondaryLabel: {
    color: colors.muted,
    fontWeight: '600',
  },
  iconButton: {
    padding: 8,
  },
  skeletonWrap: {
    gap: spacing.sm,
  },
});
