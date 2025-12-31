import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, StyleSheet, View, TouchableOpacity, TextInput } from 'react-native';
import { Search, Users, UserPlus, Mail, MessageCircle } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { getCached, setCached } from '../lib/cache';
import { useRealtimeStatus } from '../lib/realtime';
import { showError, showSuccess } from '../lib/toast';
import { colors, radius, spacing, gradients } from '../styles/common';
import { GradientBackground } from '../components/common/GradientBackground';
import { LinearGradient } from 'expo-linear-gradient';
import { SkeletonBlock } from '../components/common/Skeleton';
import { ScreenFade } from '../components/common/ScreenFade';
import { BackButton } from '../components/common/BackButton';
import { EmptyState } from '../components/common/EmptyState';
import { GlowCard } from '../components/common/GlowCard';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

const FRIENDS_TABLE = 'prijatelji';
const NOTIFICATIONS_TABLE = 'notifications';
const GROUPS_TABLE = 'groups';
const GROUP_MEMBERS_TABLE = 'group_members';
const DIRECT_MESSAGES_TABLE = 'direct_messages';
const CACHE_TTL = 1000 * 60 * 5;

type Profile = {
  id: string;
  korisnicko_ime: string;
  ukupno_poena: number | null;
  trenutni_bedz?: 'bronze' | 'silver' | 'gold' | null;
};

type FriendLink = {
  id: string;
  korisnik_od: string;
  korisnik_do: string;
  status: 'pending' | 'accepted';
};

type GroupSummary = {
  id: string;
  name: string;
  description: string | null;
};

type TabKey = 'friends' | 'requests' | 'suggestions' | 'groups';

export function FriendSystemScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const realtimeConnected = useRealtimeStatus();
  const [userId, setUserId] = useState<string | null>(null);
  const [friends, setFriends] = useState<Profile[]>([]);
  const [pendingIn, setPendingIn] = useState<FriendLink[]>([]);
  const [pendingOut, setPendingOut] = useState<FriendLink[]>([]);
  const [friendLinks, setFriendLinks] = useState<Record<string, FriendLink>>({});
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [suggestions, setSuggestions] = useState<Profile[]>([]);
  const [joinedGroups, setJoinedGroups] = useState<GroupSummary[]>([]);
  const [recommendedGroups, setRecommendedGroups] = useState<GroupSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('friends');
  const [loadingConnections, setLoadingConnections] = useState(true);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [usingCache, setUsingCache] = useState(false);
  const [friendsVisible, setFriendsVisible] = useState(10);
  const [suggestionsVisible, setSuggestionsVisible] = useState(10);

  const normalizeGroup = (row: any): GroupSummary => ({
    id: row.id,
    name: row.name ?? row.title ?? 'Grupa',
    description: row.description ?? null,
  });

  const fetchGroupsList = async (ids?: string[]) => {
    let query = supabase.from(GROUPS_TABLE).select('id, name, description');
    if (ids?.length) {
      query = query.in('id', ids);
    }
    const { data, error } = await query;
    if (error?.code === '42703') {
      let fallback = supabase.from(GROUPS_TABLE).select('id, title, description');
      if (ids?.length) {
        fallback = fallback.in('id', ids);
      }
      const { data: fallbackData, error: fallbackError } = await fallback;
      if (fallbackError) {
        throw fallbackError;
      }
      return (fallbackData ?? []).map((row: any) => normalizeGroup(row));
    }
    if (error) {
      throw error;
    }
    return (data ?? []).map((row: any) => normalizeGroup(row));
  };

  const fetchUserId = async () => {
    const { data } = await supabase.auth.getUser();
    return data?.user?.id ?? null;
  };

  const loadConnections = async (uid: string) => {
    setLoadingConnections(true);
    const { data, error: linksError } = await supabase
      .from(FRIENDS_TABLE)
      .select('*')
      .or(`korisnik_od.eq.${uid},korisnik_do.eq.${uid}`);

    if (linksError) {
      setError('Greška pri učitavanju prijatelja.');
      showError('Greška', 'Ne mogu učitati prijatelje.');
      setLoadingConnections(false);
      return;
    }

    const links = (data ?? []) as FriendLink[];
    const nextPendingIn = links.filter((l) => l.status === 'pending' && l.korisnik_do === uid);
    const nextPendingOut = links.filter((l) => l.status === 'pending' && l.korisnik_od === uid);
    setPendingIn(nextPendingIn);
    setPendingOut(nextPendingOut);

    const accepted = links.filter((l) => l.status === 'accepted');
    const linkMap = accepted.reduce<Record<string, FriendLink>>((acc, link) => {
      const otherId = link.korisnik_od === uid ? link.korisnik_do : link.korisnik_od;
      acc[otherId] = link;
      return acc;
    }, {});
    setFriendLinks(linkMap);
    const otherIds = accepted.map((l) => (l.korisnik_od === uid ? l.korisnik_do : l.korisnik_od));
    if (otherIds.length === 0) {
      setFriends([]);
      setCached(`friends:${uid}`, { friends: [], pendingIn: nextPendingIn, pendingOut: nextPendingOut });
      setLoadingConnections(false);
      return;
    }

    const { data: profiles } = await supabase
      .from('korisnik_profil')
      .select('id, korisnicko_ime, ukupno_poena, trenutni_bedz')
      .in('id', otherIds);

    const nextFriends = (profiles ?? []) as Profile[];
    setFriends(nextFriends);
    setCached(`friends:${uid}`, { friends: nextFriends, pendingIn: nextPendingIn, pendingOut: nextPendingOut });
    setUsingCache(false);
    setLoadingConnections(false);
  };

  const loadSuggestions = async (uid: string) => {
    setLoadingSuggestions(true);
    const { data } = await supabase
      .from('korisnik_profil')
      .select('id, korisnicko_ime, ukupno_poena, trenutni_bedz')
      .neq('id', uid)
      .limit(10);

    const nextSuggestions = (data ?? []) as Profile[];
    setSuggestions(nextSuggestions);
    setCached(`friend-suggestions:${uid}`, nextSuggestions);
    setUsingCache(false);
    setLoadingSuggestions(false);
  };

  const loadGroups = async (uid: string) => {
    setLoadingGroups(true);
    setError(null);
    let joined: GroupSummary[] = [];

    const { data: memberships, error: membershipError } = await supabase
      .from(GROUP_MEMBERS_TABLE)
      .select('group_id, groups ( id, name, description )')
      .eq('user_id', uid);

    if (membershipError) {
      console.error('Load groups membership error', membershipError);
      const { data: memberIds, error: memberIdsError } = await supabase
        .from(GROUP_MEMBERS_TABLE)
        .select('group_id')
        .eq('user_id', uid);

      if (memberIdsError) {
        console.error('Load groups member ids error', memberIdsError);
        showError('Greška', 'Ne možemo učitati grupe.');
        setLoadingGroups(false);
        return;
      }

      const ids = (memberIds ?? []).map((row: any) => row.group_id).filter(Boolean);
      if (ids.length) {
        try {
          joined = await fetchGroupsList(ids);
        } catch (error) {
          console.error('Load groups fallback error', error);
          showError('Greška', 'Ne možemo učitati grupe.');
          setLoadingGroups(false);
          return;
        }
      }
    } else {
      joined = (memberships ?? [])
        .map((row: any) => row.groups)
        .filter(Boolean)
        .map((row: any) => normalizeGroup(row));
    }

    setJoinedGroups(joined);

    try {
      const groups = await fetchGroupsList();
      const joinedIds = new Set(joined.map((group) => group.id));
      const shuffled = (groups ?? []).filter((group) => !joinedIds.has(group.id));
      shuffled.sort(() => Math.random() - 0.5);
      const recommended = shuffled.slice(0, 10) as GroupSummary[];
      setRecommendedGroups(recommended);
      setCached(`groups:${uid}`, { joined, recommended });
      setUsingCache(false);
    } catch (error) {
      console.error('Load groups list error', error);
      showError('Greška', 'Ne možemo učitati grupe.');
    }

    setLoadingGroups(false);
  };

  const loadUnreadCounts = async (uid: string) => {
    const { data, error } = await supabase
      .from(DIRECT_MESSAGES_TABLE)
      .select('sender_id')
      .eq('recipient_id', uid)
      .eq('is_read', false);

    if (error) {
      return;
    }

    const counts = (data ?? []).reduce<Record<string, number>>((acc, row: any) => {
      const senderId = row.sender_id;
      if (!senderId) return acc;
      acc[senderId] = (acc[senderId] ?? 0) + 1;
      return acc;
    }, {});

    setUnreadCounts(counts);
  };

  useEffect(() => {
    const init = async () => {
      const uid = await fetchUserId();
      setUserId(uid);
      if (!uid) return;
      const cachedFriends = await getCached<{ friends: Profile[]; pendingIn: FriendLink[]; pendingOut: FriendLink[] }>(
        `friends:${uid}`,
        CACHE_TTL
      );
      if (cachedFriends?.value) {
        setFriends(cachedFriends.value.friends ?? []);
        setPendingIn(cachedFriends.value.pendingIn ?? []);
        setPendingOut(cachedFriends.value.pendingOut ?? []);
        setUsingCache(cachedFriends.isStale);
        setLoadingConnections(false);
      }
      const cachedSuggestions = await getCached<Profile[]>(`friend-suggestions:${uid}`, CACHE_TTL);
      if (cachedSuggestions?.value?.length) {
        setSuggestions(cachedSuggestions.value);
        setUsingCache(cachedSuggestions.isStale);
        setLoadingSuggestions(false);
      }
      const cachedGroups = await getCached<{ joined: GroupSummary[]; recommended: GroupSummary[] }>(
        `groups:${uid}`,
        CACHE_TTL
      );
      if (cachedGroups?.value) {
        setJoinedGroups(cachedGroups.value.joined ?? []);
        setRecommendedGroups(cachedGroups.value.recommended ?? []);
        setUsingCache(cachedGroups.isStale);
        setLoadingGroups(false);
      }
      await loadConnections(uid);
      await loadSuggestions(uid);
      await loadGroups(uid);
      await loadUnreadCounts(uid);
    };
    init();
  }, []);

  useEffect(() => {
    if (!userId) return;
    const inbound = supabase
      .channel('friends-inbound')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: FRIENDS_TABLE,
          filter: `korisnik_do=eq.${userId}`,
        },
        () => loadConnections(userId)
      )
      .subscribe();

    const outbound = supabase
      .channel('friends-outbound')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: FRIENDS_TABLE,
          filter: `korisnik_od=eq.${userId}`,
        },
        () => loadConnections(userId)
      )
      .subscribe();

    const groupMembership = supabase
      .channel('group-membership')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: GROUP_MEMBERS_TABLE,
          filter: `user_id=eq.${userId}`,
        },
        () => loadGroups(userId)
      )
      .subscribe();

    const groupsChannel = supabase
      .channel('groups-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: GROUPS_TABLE,
        },
        () => loadGroups(userId)
      )
      .subscribe();

    const messagesChannel = supabase
      .channel('direct-messages-unread')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: DIRECT_MESSAGES_TABLE,
          filter: `recipient_id=eq.${userId}`,
        },
        () => loadUnreadCounts(userId)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(inbound);
      supabase.removeChannel(outbound);
      supabase.removeChannel(groupMembership);
      supabase.removeChannel(groupsChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [userId]);

  useEffect(() => {
    if (!userId || realtimeConnected) return;
    const interval = setInterval(() => {
      loadConnections(userId);
      loadSuggestions(userId);
      loadGroups(userId);
      loadUnreadCounts(userId);
    }, 20000);
    return () => clearInterval(interval);
  }, [userId, realtimeConnected]);

  const sendRequest = async (targetId: string) => {
    if (!userId) return;
    setError(null);

    const optimistic: FriendLink = {
      id: `temp-${targetId}`,
      korisnik_od: userId,
      korisnik_do: targetId,
      status: 'pending',
    };
    const previousSuggestions = suggestions;
    setPendingOut((prev) => [...prev, optimistic]);
    setSuggestions((prev) => prev.filter((s) => s.id !== targetId));

    const { data: link, error: insertError } = await supabase
      .from(FRIENDS_TABLE)
      .insert({ korisnik_od: userId, korisnik_do: targetId, status: 'pending' })
      .select('id')
      .single();

    if (insertError) {
      setError('Ne možemo poslati zahtjev.');
      showError('Greška', 'Ne možemo poslati zahtjev.');
      setPendingOut((prev) => prev.filter((item) => item.id !== optimistic.id));
      setSuggestions(previousSuggestions);
      return;
    }

    setPendingOut((prev) =>
      prev.map((item) => (item.id === optimistic.id ? { ...item, id: link?.id ?? item.id } : item))
    );

    const { data: profile } = await supabase
      .from('korisnik_profil')
      .select('korisnicko_ime')
      .eq('id', userId)
      .maybeSingle();
    const senderName = profile?.korisnicko_ime ?? 'Korisnik';

    if (link?.id) {
      await supabase.from(NOTIFICATIONS_TABLE).insert({
        korisnik_id: targetId,
        title: 'Novi zahtjev za prijateljstvo',
        body: `${senderName} vam je poslao zahtjev za prijateljstvo.`,
        type: 'friend_request',
        related_id: link.id,
        status: 'unread',
      });
    }

    showSuccess('Poslato', 'Zahtjev je poslat.');
    await loadConnections(userId);
  };

  const acceptRequest = async (link: FriendLink) => {
    if (!userId) return;
    setPendingIn((prev) => prev.filter((item) => item.id !== link.id));
    const { error: updateError } = await supabase
      .from(FRIENDS_TABLE)
      .update({ status: 'accepted' })
      .eq('id', link.id);

    if (updateError) {
      setError('Ne možemo prihvatiti zahtjev.');
      showError('Greška', 'Ne možemo prihvatiti zahtjev.');
      setPendingIn((prev) => [...prev, link]);
      return;
    }

    const { data: profile } = await supabase
      .from('korisnik_profil')
      .select('korisnicko_ime')
      .eq('id', userId)
      .maybeSingle();
    const receiverName = profile?.korisnicko_ime ?? 'Korisnik';

    const { data: friendProfile } = await supabase
      .from('korisnik_profil')
      .select('id, korisnicko_ime, ukupno_poena, trenutni_bedz')
      .eq('id', link.korisnik_od)
      .maybeSingle();
    if (friendProfile) {
      setFriends((prev) => [friendProfile as Profile, ...prev]);
    }

    await supabase.from(NOTIFICATIONS_TABLE).insert({
      korisnik_id: link.korisnik_od,
      title: 'Zahtjev prihvaćen',
      body: `${receiverName} je prihvatio/la vaš zahtjev.`,
      type: 'friend_accept',
      related_id: link.id,
      status: 'unread',
    });

    await supabase
      .from(NOTIFICATIONS_TABLE)
      .update({ status: 'read' })
      .eq('related_id', link.id)
      .eq('korisnik_id', userId);

    showSuccess('Uspjeh', 'Zahtjev je prihvaćen.');
    await loadConnections(userId);
  };

  const removeFriend = async (friendId: string) => {
    if (!userId) return;
    const link = friendLinks[friendId];
    if (!link) return;

    const previous = friends;
    setFriends((prev) => prev.filter((friend) => friend.id !== friendId));
    const { error: deleteError } = await supabase.from(FRIENDS_TABLE).delete().eq('id', link.id);

    if (deleteError) {
      setFriends(previous);
      showError('Greška', 'Ne možemo ukloniti prijatelja.');
      return;
    }

    showSuccess('Uklonjeno', 'Prijatelj je uklonjen.');
    await loadConnections(userId);
  };

  const startChat = (friend: Profile) => {
    navigation.navigate('FriendChat', { friendId: friend.id, friendName: friend.korisnicko_ime });
  };

  const joinGroup = async (groupId: string) => {
    if (!userId) return;
    const group = recommendedGroups.find((item) => item.id === groupId);
    const previousRecommended = recommendedGroups;
    const previousJoined = joinedGroups;
    setRecommendedGroups((prev) => prev.filter((item) => item.id !== groupId));
    if (group) setJoinedGroups((prev) => [group, ...prev]);

    const { error: insertError } = await supabase.from(GROUP_MEMBERS_TABLE).insert({
      group_id: groupId,
      user_id: userId,
      role: 'member',
    });

    if (insertError) {
      showError('Greška', 'Ne možemo se pridružiti grupi.');
      setRecommendedGroups(previousRecommended);
      setJoinedGroups(previousJoined);
      return;
    }

    showSuccess('Uspjeh', 'Pridružili ste se grupi.');
    await loadGroups(userId);
  };

  const openGroup = (groupId: string) => {
    navigation.navigate('GroupDetail', { groupId });
  };

  const filteredFriends = useMemo(() => {
    return friends.filter((friend) =>
      friend.korisnicko_ime?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [friends, searchQuery]);

  const visibleFriends = filteredFriends.slice(0, friendsVisible);
  const visibleSuggestions = suggestions.slice(0, suggestionsVisible);

  return (
    <GradientBackground>
      <ScreenFade>
        <ScrollView contentContainerStyle={styles.content}>
          <BackButton onPress={() => navigation.goBack()} />
          <View style={styles.header}>
            <Text style={styles.title}>Prijatelji</Text>
            <Text style={styles.subtitle}>Poveži se s eko zajednicom</Text>
          </View>

          <View style={styles.searchWrap}>
            <Search size={16} color={colors.muted} style={styles.searchIcon} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Pretraži prijatelje..."
              placeholderTextColor={colors.muted}
              style={styles.searchInput}
            />
          </View>

          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'friends' && styles.tabActive]}
              onPress={() => setActiveTab('friends')}
            >
              <Users size={16} color={activeTab === 'friends' ? colors.softGreen : colors.muted} />
              <Text style={[styles.tabText, activeTab === 'friends' && styles.tabTextActive]}>
                Prijatelji
              </Text>
              <Text style={styles.tabCount}>{friends.length}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'requests' && styles.tabActive]}
              onPress={() => setActiveTab('requests')}
            >
              <Mail size={16} color={activeTab === 'requests' ? colors.softGreen : colors.muted} />
              <Text style={[styles.tabText, activeTab === 'requests' && styles.tabTextActive]}>
                Zahtjevi
              </Text>
              <Text style={styles.tabCount}>{pendingIn.length}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'groups' && styles.tabActive]}
              onPress={() => setActiveTab('groups')}
            >
              <Users size={16} color={activeTab === 'groups' ? colors.softGreen : colors.muted} />
              <Text style={[styles.tabText, activeTab === 'groups' && styles.tabTextActive]}>Grupe</Text>
              <Text style={styles.tabCount}>{joinedGroups.length}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'suggestions' && styles.tabActive]}
              onPress={() => setActiveTab('suggestions')}
            >
              <UserPlus size={16} color={activeTab === 'suggestions' ? colors.softGreen : colors.muted} />
              <Text style={[styles.tabText, activeTab === 'suggestions' && styles.tabTextActive]}>
                Preporuke
              </Text>
            </TouchableOpacity>
          </View>

          {error && <Text style={styles.error}>{error}</Text>}
          {usingCache && <Text style={styles.cacheNote}>Prikazujem keširane podatke.</Text>}

          {activeTab === 'friends' && (
            <View style={styles.section}>
              {loadingConnections && filteredFriends.length === 0 ? (
                <View style={styles.skeletonGroup}>
                  {Array.from({ length: 3 }).map((_, index) => (
                  <GlowCard key={`friend-skeleton-${index}`} style={styles.cardShell} contentStyle={styles.card}>
                    <View>
                      <SkeletonBlock width={120} height={14} />
                      <SkeletonBlock width={80} height={10} style={{ marginTop: 8 }} />
                    </View>
                    <SkeletonBlock width={50} height={12} />
                  </GlowCard>
                ))}
              </View>
            ) : filteredFriends.length === 0 ? (
                <EmptyState
                  title="Još nemate prijatelja"
                  description="Povežite se sa zajednicom i pratite napredak."
                />
              ) : (
                <>
                  {visibleFriends.map((friend) => (
                    <GlowCard key={friend.id} style={styles.cardShell} contentStyle={styles.card}>
                      <View>
                        <Text style={styles.cardTitle}>{friend.korisnicko_ime}</Text>
                        <Text style={styles.cardSubtitle}>Poeni: {friend.ukupno_poena ?? 0}</Text>
                      </View>
                      <View style={styles.friendActions}>
                        <Text style={styles.badgeText}>{friend.trenutni_bedz ?? 'bronze'}</Text>
                        <View style={styles.friendButtons}>
                          <TouchableOpacity onPress={() => startChat(friend)}>
                            <LinearGradient colors={gradients.primary} style={styles.chatButton}>
                              <MessageCircle size={14} color={colors.text} />
                              <Text style={styles.chatText}>Chat</Text>
                            </LinearGradient>
                          </TouchableOpacity>
                          {unreadCounts[friend.id] ? (
                            <View style={styles.unreadBadge}>
                              <Text style={styles.unreadText}>{unreadCounts[friend.id]}</Text>
                            </View>
                          ) : null}
                          <TouchableOpacity onPress={() => removeFriend(friend.id)} style={styles.removeButton}>
                            <Text style={styles.removeText}>Ukloni</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </GlowCard>
                  ))}
                  {filteredFriends.length > friendsVisible ? (
                    <TouchableOpacity onPress={() => setFriendsVisible((prev) => prev + 10)}>
                      <LinearGradient colors={gradients.primary} style={styles.loadMoreButton}>
                        <Text style={styles.loadMoreText}>Prikaži više</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  ) : null}
                </>
              )}
            </View>
          )}

          {activeTab === 'requests' && (
            <View style={styles.section}>
              {loadingConnections && pendingIn.length === 0 && pendingOut.length === 0 ? (
                <View style={styles.skeletonGroup}>
                  {Array.from({ length: 2 }).map((_, index) => (
                  <GlowCard key={`request-skeleton-${index}`} style={styles.cardShell} contentStyle={styles.card}>
                    <SkeletonBlock width={150} height={14} />
                    <SkeletonBlock width={80} height={10} style={{ marginTop: 8 }} />
                  </GlowCard>
                ))}
              </View>
            ) : pendingIn.length === 0 && pendingOut.length === 0 ? (
              <EmptyState
                title="Nema aktivnih zahtjeva"
                description="Novi zahtjevi će se pojaviti ovdje."
              />
            ) : (
                <>
                  {pendingIn.map((req) => (
                  <GlowCard key={req.id} style={styles.cardShell} contentStyle={styles.card}>
                    <Text style={styles.cardTitle}>Primljen zahtjev</Text>
                    <TouchableOpacity onPress={() => acceptRequest(req)}>
                      <LinearGradient colors={gradients.primary} style={styles.actionButton}>
                        <Text style={styles.actionLabel}>Prihvati</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </GlowCard>
                ))}
                {pendingOut.map((req) => (
                  <GlowCard key={req.id} style={styles.cardShell} contentStyle={styles.card}>
                    <Text style={styles.cardTitle}>Poslan zahtjev (na čekanju)</Text>
                  </GlowCard>
                ))}
              </>
            )}
            </View>
          )}

          {activeTab === 'suggestions' && (
            <View style={styles.section}>
            {loadingSuggestions && suggestions.length === 0 ? (
              <View style={styles.skeletonGroup}>
                  {Array.from({ length: 3 }).map((_, index) => (
                  <GlowCard key={`suggestion-skeleton-${index}`} style={styles.cardShell} contentStyle={styles.card}>
                    <View>
                      <SkeletonBlock width={120} height={14} />
                      <SkeletonBlock width={80} height={10} style={{ marginTop: 8 }} />
                    </View>
                    <SkeletonBlock width={70} height={12} />
                  </GlowCard>
                ))}
              </View>
            ) : (
                <>
                  {visibleSuggestions.map((suggestion) => (
                  <GlowCard key={suggestion.id} style={styles.cardShell} contentStyle={styles.card}>
                    <View>
                      <Text style={styles.cardTitle}>{suggestion.korisnicko_ime}</Text>
                      <Text style={styles.cardSubtitle}>Poeni: {suggestion.ukupno_poena ?? 0}</Text>
                    </View>
                    <TouchableOpacity onPress={() => sendRequest(suggestion.id)}>
                      <LinearGradient colors={gradients.primary} style={styles.actionButton}>
                        <Text style={styles.actionLabel}>Dodaj</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </GlowCard>
                  ))}
                  {suggestions.length === 0 ? (
                    <EmptyState
                      title="Nema preporuka"
                      description="Pokušaćemo da pronađemo nove korisnike."
                    />
                  ) : null}
                  {suggestions.length > suggestionsVisible ? (
                    <TouchableOpacity onPress={() => setSuggestionsVisible((prev) => prev + 10)}>
                      <LinearGradient colors={gradients.primary} style={styles.loadMoreButton}>
                        <Text style={styles.loadMoreText}>Prikaži više</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  ) : null}
                </>
            )}
          </View>
        )}

          {activeTab === 'groups' && (
            <View style={styles.section}>
              <View style={styles.groupActions}>
                <TouchableOpacity onPress={() => navigation.navigate('CreateGroup')}>
                  <LinearGradient colors={gradients.primary} style={styles.createGroupButton}>
                    <Text style={styles.createGroupLabel}>Kreiraj grupu</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
              {loadingGroups && joinedGroups.length === 0 && recommendedGroups.length === 0 ? (
                <View style={styles.skeletonGroup}>
                  {Array.from({ length: 3 }).map((_, index) => (
                  <GlowCard key={`group-skeleton-${index}`} style={styles.cardShell} contentStyle={styles.card}>
                    <View>
                      <SkeletonBlock width={150} height={14} />
                      <SkeletonBlock width={90} height={10} style={{ marginTop: 8 }} />
                    </View>
                    <SkeletonBlock width={70} height={12} />
                  </GlowCard>
                ))}
              </View>
            ) : (
                <>
                <Text style={styles.sectionTitle}>Moje grupe</Text>
                {joinedGroups.length === 0 ? (
                  <EmptyState
                    title="Niste član nijedne grupe"
                    description="Pridružite se grupi i pratite zajedničke izazove."
                  />
                ) : (
                  joinedGroups.map((group) => (
                      <GlowCard key={group.id} style={styles.cardShell} contentStyle={styles.card}>
                        <View style={styles.groupText}>
                          <Text style={styles.cardTitle}>{group.name}</Text>
                          {group.description ? (
                            <Text style={styles.cardSubtitle}>{group.description}</Text>
                          ) : null}
                        </View>
                        <TouchableOpacity onPress={() => openGroup(group.id)}>
                          <LinearGradient colors={gradients.primary} style={styles.actionButton}>
                            <Text style={styles.actionLabel}>Otvori</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      </GlowCard>
                    ))
                )}
                <Text style={[styles.sectionTitle, { marginTop: spacing.md }]}>Preporučene grupe</Text>
                {recommendedGroups.length === 0 ? (
                  <EmptyState
                    title="Trenutno nema preporučenih grupa"
                    description="Vrati se kasnije za nove preporuke."
                  />
                ) : (
                  recommendedGroups.map((group) => (
                      <GlowCard key={group.id} style={styles.cardShell} contentStyle={styles.card}>
                        <View style={styles.groupText}>
                          <Text style={styles.cardTitle}>{group.name}</Text>
                          {group.description ? (
                            <Text style={styles.cardSubtitle}>{group.description}</Text>
                          ) : null}
                        </View>
                        <TouchableOpacity onPress={() => joinGroup(group.id)}>
                          <LinearGradient colors={gradients.primary} style={styles.actionButton}>
                            <Text style={styles.actionLabel}>Pridruži se</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      </GlowCard>
                    ))
                )}
                </>
              )}
            </View>
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
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '600',
  },
  subtitle: {
    color: colors.softGreen,
    marginTop: spacing.xs,
  },
  searchWrap: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    top: 12,
  },
  searchInput: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderColor: 'rgba(51, 65, 85, 0.4)',
    borderWidth: 1,
    borderRadius: radius.lg,
    color: colors.text,
    paddingVertical: 12,
    paddingHorizontal: 40,
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
  tabCount: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    color: colors.softGreen,
    fontSize: 12,
    paddingHorizontal: 6,
    borderRadius: 999,
  },
  section: {
    marginBottom: spacing.lg,
  },
  cardShell: {
    marginBottom: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    color: colors.text,
    fontWeight: '600',
  },
  cardSubtitle: {
    color: colors.muted,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  badgeText: {
    color: colors.primary,
    fontWeight: '600',
  },
  friendActions: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  friendButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.sm,
  },
  chatText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 12,
  },
  removeButton: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  removeText: {
    color: '#f87171',
    fontWeight: '600',
    fontSize: 12,
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.softGreen,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 12,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: radius.md,
  },
  actionLabel: {
    color: colors.text,
    fontWeight: '600',
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
  sectionTitle: {
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  groupActions: {
    marginBottom: spacing.md,
    alignSelf: 'flex-start',
  },
  createGroupButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.lg,
  },
  createGroupLabel: {
    color: colors.text,
    fontWeight: '600',
  },
  groupText: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  loadMoreButton: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: radius.lg,
    marginTop: spacing.sm,
  },
  loadMoreText: {
    color: colors.text,
    fontWeight: '600',
  },
  skeletonGroup: {
    gap: spacing.sm,
  },
});
