import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, StyleSheet, View, TouchableOpacity, TextInput } from 'react-native';
import { Search, Users, UserPlus, Mail } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { getCached, setCached } from '../lib/cache';
import { useRealtimeStatus } from '../lib/realtime';
import { showError, showSuccess } from '../lib/toast';
import { colors, radius, spacing, gradients } from '../styles/common';
import { GradientBackground } from '../components/common/GradientBackground';
import { LinearGradient } from 'expo-linear-gradient';
import { SkeletonBlock } from '../components/common/Skeleton';

const FRIENDS_TABLE = 'prijatelji';
const NOTIFICATIONS_TABLE = 'notifications';
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

type TabKey = 'friends' | 'requests' | 'suggestions';

export function FriendSystemScreen() {
  const realtimeConnected = useRealtimeStatus();
  const [userId, setUserId] = useState<string | null>(null);
  const [friends, setFriends] = useState<Profile[]>([]);
  const [pendingIn, setPendingIn] = useState<FriendLink[]>([]);
  const [pendingOut, setPendingOut] = useState<FriendLink[]>([]);
  const [suggestions, setSuggestions] = useState<Profile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('friends');
  const [loadingConnections, setLoadingConnections] = useState(true);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [usingCache, setUsingCache] = useState(false);

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
      await loadConnections(uid);
      await loadSuggestions(uid);
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

    return () => {
      supabase.removeChannel(inbound);
      supabase.removeChannel(outbound);
    };
  }, [userId]);

  useEffect(() => {
    if (!userId || realtimeConnected) return;
    const interval = setInterval(() => {
      loadConnections(userId);
      loadSuggestions(userId);
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

  const filteredFriends = useMemo(() => {
    return friends.filter((friend) =>
      friend.korisnicko_ime?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [friends, searchQuery]);

  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={styles.content}>
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
            <Text style={[styles.tabText, activeTab === 'friends' && styles.tabTextActive]}>Prijatelji</Text>
            <Text style={styles.tabCount}>{friends.length}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'requests' && styles.tabActive]}
            onPress={() => setActiveTab('requests')}
          >
            <Mail size={16} color={activeTab === 'requests' ? colors.softGreen : colors.muted} />
            <Text style={[styles.tabText, activeTab === 'requests' && styles.tabTextActive]}>Zahtjevi</Text>
            <Text style={styles.tabCount}>{pendingIn.length}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'suggestions' && styles.tabActive]}
            onPress={() => setActiveTab('suggestions')}
          >
            <UserPlus size={16} color={activeTab === 'suggestions' ? colors.softGreen : colors.muted} />
            <Text style={[styles.tabText, activeTab === 'suggestions' && styles.tabTextActive]}>Preporuke</Text>
          </TouchableOpacity>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}
        {usingCache && <Text style={styles.cacheNote}>Prikazujem keširane podatke.</Text>}

        {activeTab === 'friends' && (
          <View style={styles.section}>
            {loadingConnections && filteredFriends.length === 0 ? (
              <View style={styles.skeletonGroup}>
                {Array.from({ length: 3 }).map((_, index) => (
                  <View key={`friend-skeleton-${index}`} style={styles.card}>
                    <View>
                      <SkeletonBlock width={120} height={14} />
                      <SkeletonBlock width={80} height={10} style={{ marginTop: 8 }} />
                    </View>
                    <SkeletonBlock width={50} height={12} />
                  </View>
                ))}
              </View>
            ) : filteredFriends.length === 0 ? (
              <Text style={styles.muted}>Još nemate prijatelja.</Text>
            ) : (
              filteredFriends.map((friend) => (
                <View key={friend.id} style={styles.card}>
                  <View>
                    <Text style={styles.cardTitle}>{friend.korisnicko_ime}</Text>
                    <Text style={styles.cardSubtitle}>Poeni: {friend.ukupno_poena ?? 0}</Text>
                  </View>
                  <Text style={styles.badgeText}>{friend.trenutni_bedz ?? 'bronze'}</Text>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'requests' && (
          <View style={styles.section}>
            {loadingConnections && pendingIn.length === 0 && pendingOut.length === 0 ? (
              <View style={styles.skeletonGroup}>
                {Array.from({ length: 2 }).map((_, index) => (
                  <View key={`request-skeleton-${index}`} style={styles.card}>
                    <SkeletonBlock width={150} height={14} />
                    <SkeletonBlock width={80} height={10} style={{ marginTop: 8 }} />
                  </View>
                ))}
              </View>
            ) : pendingIn.length === 0 && pendingOut.length === 0 ? (
              <Text style={styles.muted}>Nema aktivnih zahtjeva.</Text>
            ) : (
              <>
                {pendingIn.map((req) => (
                  <View key={req.id} style={styles.card}>
                    <Text style={styles.cardTitle}>Primljen zahtjev</Text>
                    <TouchableOpacity onPress={() => acceptRequest(req)}>
                      <LinearGradient colors={gradients.primary} style={styles.actionButton}>
                        <Text style={styles.actionLabel}>Prihvati</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                ))}
                {pendingOut.map((req) => (
                  <View key={req.id} style={styles.card}>
                    <Text style={styles.cardTitle}>Poslan zahtjev (na čekanju)</Text>
                  </View>
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
                  <View key={`suggestion-skeleton-${index}`} style={styles.card}>
                    <View>
                      <SkeletonBlock width={120} height={14} />
                      <SkeletonBlock width={80} height={10} style={{ marginTop: 8 }} />
                    </View>
                    <SkeletonBlock width={70} height={12} />
                  </View>
                ))}
              </View>
            ) : (
              suggestions.map((suggestion) => (
              <View key={suggestion.id} style={styles.card}>
                <View>
                  <Text style={styles.cardTitle}>{suggestion.korisnicko_ime}</Text>
                  <Text style={styles.cardSubtitle}>Poeni: {suggestion.ukupno_poena ?? 0}</Text>
                </View>
                <TouchableOpacity onPress={() => sendRequest(suggestion.id)}>
                  <LinearGradient colors={gradients.primary} style={styles.actionButton}>
                    <Text style={styles.actionLabel}>Dodaj</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ))
            )}
          </View>
        )}
      </ScrollView>
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
  skeletonGroup: {
    gap: spacing.sm,
  },
});
