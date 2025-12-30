import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, StyleSheet, View, TouchableOpacity, TextInput } from 'react-native';
import { Search, Users, UserPlus, Mail } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { colors, radius, spacing, gradients } from '../styles/common';
import { GradientBackground } from '../components/common/GradientBackground';
import { LinearGradient } from 'expo-linear-gradient';

const FRIENDS_TABLE = 'prijatelji';

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
  const [userId, setUserId] = useState<string | null>(null);
  const [friends, setFriends] = useState<Profile[]>([]);
  const [pendingIn, setPendingIn] = useState<FriendLink[]>([]);
  const [pendingOut, setPendingOut] = useState<FriendLink[]>([]);
  const [suggestions, setSuggestions] = useState<Profile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('friends');

  const fetchUserId = async () => {
    const { data } = await supabase.auth.getUser();
    return data?.user?.id ?? null;
  };

  const loadConnections = async (uid: string) => {
    const { data, error: linksError } = await supabase
      .from(FRIENDS_TABLE)
      .select('*')
      .or(`korisnik_od.eq.${uid},korisnik_do.eq.${uid}`);

    if (linksError) {
      setError('Greška pri učitavanju prijatelja.');
      return;
    }

    const links = (data ?? []) as FriendLink[];
    setPendingIn(links.filter((l) => l.status === 'pending' && l.korisnik_do === uid));
    setPendingOut(links.filter((l) => l.status === 'pending' && l.korisnik_od === uid));

    const accepted = links.filter((l) => l.status === 'accepted');
    const otherIds = accepted.map((l) => (l.korisnik_od === uid ? l.korisnik_do : l.korisnik_od));
    if (otherIds.length === 0) {
      setFriends([]);
      return;
    }

    const { data: profiles } = await supabase
      .from('korisnik_profil')
      .select('id, korisnicko_ime, ukupno_poena, trenutni_bedz')
      .in('id', otherIds);

    setFriends((profiles ?? []) as Profile[]);
  };

  const loadSuggestions = async (uid: string) => {
    const { data } = await supabase
      .from('korisnik_profil')
      .select('id, korisnicko_ime, ukupno_poena, trenutni_bedz')
      .neq('id', uid)
      .limit(10);

    setSuggestions((data ?? []) as Profile[]);
  };

  useEffect(() => {
    const init = async () => {
      const uid = await fetchUserId();
      setUserId(uid);
      if (!uid) return;
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
    if (!userId) return;
    const interval = setInterval(() => {
      loadConnections(userId);
      loadSuggestions(userId);
    }, 20000);
    return () => clearInterval(interval);
  }, [userId]);

  const sendRequest = async (targetId: string) => {
    if (!userId) return;
    setError(null);
    const { error: insertError } = await supabase
      .from(FRIENDS_TABLE)
      .insert({ korisnik_od: userId, korisnik_do: targetId, status: 'pending' });

    if (insertError) {
      setError('Ne možemo poslati zahtjev.');
      return;
    }

    await loadConnections(userId);
  };

  const acceptRequest = async (linkId: string) => {
    if (!userId) return;
    const { error: updateError } = await supabase
      .from(FRIENDS_TABLE)
      .update({ status: 'accepted' })
      .eq('id', linkId);

    if (updateError) {
      setError('Ne možemo prihvatiti zahtjev.');
      return;
    }

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

        {activeTab === 'friends' && (
          <View style={styles.section}>
            {filteredFriends.length === 0 ? (
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
            {pendingIn.length === 0 && pendingOut.length === 0 ? (
              <Text style={styles.muted}>Nema aktivnih zahtjeva.</Text>
            ) : (
              <>
                {pendingIn.map((req) => (
                  <View key={req.id} style={styles.card}>
                    <Text style={styles.cardTitle}>Primljen zahtjev</Text>
                    <TouchableOpacity onPress={() => acceptRequest(req.id)}>
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
            {suggestions.map((suggestion) => (
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
            ))}
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
});
