import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, StyleSheet, View, TextInput, TouchableOpacity } from 'react-native';
import { Search } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { getCached, setCached } from '../lib/cache';
import { useRealtimeStatus } from '../lib/realtime';
import { colors, radius, spacing, gradients } from '../styles/common';
import { GradientBackground } from '../components/common/GradientBackground';
import { LinearGradient } from 'expo-linear-gradient';
import { SkeletonBlock } from '../components/common/Skeleton';

type Profile = {
  id: string;
  korisnicko_ime: string;
  ukupno_poena: number | null;
  trenutni_bedz?: 'bronze' | 'silver' | 'gold' | null;
};

const levelLabelFromPoints = (pts: number) => {
  if (pts >= 5000) return 'Legenda prirode';
  if (pts >= 2500) return 'Eko heroj';
  if (pts >= 1000) return 'Eko borac';
  if (pts >= 500) return 'Aktivan član';
  if (pts >= 100) return 'Početnik';
  return 'Rookie';
};

const filterOptions = [
  { id: 'all', label: 'Svi' },
  { id: 'gold', label: 'Gold' },
  { id: 'silver', label: 'Silver' },
  { id: 'bronze', label: 'Bronze' },
];
const CACHE_TTL = 1000 * 60 * 5;

export function CommunityScreen() {
  const realtimeConnected = useRealtimeStatus();
  const [users, setUsers] = useState<Profile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'gold' | 'silver' | 'bronze'>('all');
  const [loading, setLoading] = useState(true);
  const [usingCache, setUsingCache] = useState(false);

  const loadLeaderboard = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('korisnik_profil')
      .select('id, korisnicko_ime, ukupno_poena, trenutni_bedz')
      .order('ukupno_poena', { ascending: false })
      .limit(50);

    if (error) {
      setError('Greška pri učitavanju rang liste.');
      setLoading(false);
      return;
    }

    setUsers((data ?? []) as Profile[]);
    setCached('community-leaderboard', (data ?? []) as Profile[]);
    setUsingCache(false);
    setLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      const cached = await getCached<Profile[]>('community-leaderboard', CACHE_TTL);
      if (cached?.value?.length) {
        setUsers(cached.value);
        setUsingCache(cached.isStale);
        setLoading(false);
      }
      loadLeaderboard();
    };
    init();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('community-leaderboard')
      .on(
        'postgres_changes',
          { event: '*', schema: 'public', table: 'korisnik_profil' },
          () => loadLeaderboard()
        )
        .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (realtimeConnected) return;
    const interval = setInterval(() => {
      loadLeaderboard();
    }, 20000);
    return () => clearInterval(interval);
  }, [realtimeConnected]);

  const filtered = useMemo(() => {
    return users.filter((user) => {
      const nameMatch = user.korisnicko_ime?.toLowerCase().includes(searchQuery.toLowerCase());
      const badge = (user.trenutni_bedz ?? 'bronze') as 'gold' | 'silver' | 'bronze';
      const badgeMatch = filter === 'all' ? true : badge === filter;
      return nameMatch && badgeMatch;
    });
  }, [users, searchQuery, filter]);

  const podium = filtered.slice(0, 3);
  const rest = filtered.slice(3);

  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Zajednica</Text>
          <Text style={styles.subtitle}>Top rang lista i bedževi</Text>
        </View>

        <View style={styles.searchContainer}>
          <Search size={16} color={colors.muted} style={styles.searchIcon} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Pretraži korisnike..."
            placeholderTextColor={colors.muted}
            style={styles.searchInput}
          />
        </View>

        <View style={styles.filterRow}>
          {filterOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[styles.filterTab, filter === option.id && styles.filterTabActive]}
              onPress={() => setFilter(option.id as any)}
            >
              <Text style={[styles.filterText, filter === option.id && styles.filterTextActive]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {error && <Text style={styles.error}>{error}</Text>}
        {usingCache && <Text style={styles.cacheNote}>Prikazujem keširane podatke.</Text>}

        {loading && users.length === 0 ? (
          <View style={styles.skeletonWrap}>
            <View style={styles.podiumRow}>
              {Array.from({ length: 3 }).map((_, index) => (
                <View key={`podium-skeleton-${index}`} style={styles.podiumItem}>
                  <SkeletonBlock width={40} height={40} radiusSize={20} />
                  <SkeletonBlock width={48} height={48} radiusSize={24} style={{ marginTop: 12 }} />
                  <SkeletonBlock width={80} height={12} style={{ marginTop: 10 }} />
                  <SkeletonBlock width={60} height={10} style={{ marginTop: 6 }} />
                </View>
              ))}
            </View>
            <View style={styles.listSection}>
              {Array.from({ length: 4 }).map((_, index) => (
                <View key={`list-skeleton-${index}`} style={styles.listItem}>
                  <View>
                    <SkeletonBlock width={120} height={12} />
                    <SkeletonBlock width={80} height={10} style={{ marginTop: 8 }} />
                  </View>
                  <SkeletonBlock width={50} height={12} />
                </View>
              ))}
            </View>
          </View>
        ) : (
          <>
            <View style={styles.podiumRow}>
              {[podium[1], podium[0], podium[2]].map((user, index) => {
                if (!user) return null;
                const rank = index === 0 ? 2 : index === 1 ? 1 : 3;
                const badge = user.trenutni_bedz ?? 'bronze';
                const badgeColor = badge === 'gold' ? '#fbbf24' : badge === 'silver' ? '#9ca3af' : '#cd7f32';
                const orderStyle = rank === 1 ? styles.podiumFirst : rank === 2 ? styles.podiumSecond : styles.podiumThird;
                return (
                  <View key={user.id} style={[styles.podiumItem, orderStyle]}>
                    <LinearGradient colors={[badgeColor, '#0f172a']} style={styles.podiumRank}>
                      <Text style={styles.podiumRankText}>{rank}</Text>
                    </LinearGradient>
                    <LinearGradient colors={gradients.primary} style={styles.podiumAvatar}>
                      <Text style={styles.podiumAvatarText}>{user.korisnicko_ime?.[0]?.toUpperCase() ?? 'U'}</Text>
                    </LinearGradient>
                    <Text style={styles.podiumName}>{user.korisnicko_ime}</Text>
                    <Text style={styles.podiumPoints}>{user.ukupno_poena ?? 0} poena</Text>
                  </View>
                );
              })}
            </View>

            <View style={styles.listSection}>
              {rest.map((user, index) => {
                const rank = index + 4;
                const badge = user.trenutni_bedz ?? 'bronze';
                const badgeColor = badge === 'gold' ? colors.gold : badge === 'silver' ? colors.silver : colors.bronze;
                return (
                  <View key={user.id} style={[styles.listItem, { borderColor: badgeColor }]}> 
                    <View>
                      <Text style={styles.listName}>{rank}. {user.korisnicko_ime}</Text>
                      <Text style={styles.listLevel}>{levelLabelFromPoints(user.ukupno_poena ?? 0)}</Text>
                    </View>
                    <View style={styles.listPoints}>
                      <Text style={styles.pointsValue}>{user.ukupno_poena ?? 0}</Text>
                      <Text style={[styles.badgeText, { color: badgeColor }]}>{badge}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
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
  cacheNote: {
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  searchContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    top: 12,
  },
  searchInput: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderColor: 'rgba(51, 65, 85, 0.5)',
    borderWidth: 1,
    borderRadius: radius.md,
    color: colors.text,
    paddingVertical: 10,
    paddingHorizontal: 36,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filterTab: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
  },
  filterTabActive: {
    borderColor: 'rgba(34, 197, 94, 0.3)',
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  filterText: {
    color: colors.muted,
    fontWeight: '500',
  },
  filterTextActive: {
    color: colors.softGreen,
  },
  error: {
    color: colors.danger,
    marginBottom: spacing.sm,
  },
  podiumRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    alignItems: 'flex-end',
  },
  podiumItem: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  podiumFirst: {
    paddingTop: spacing.xl,
    borderColor: 'rgba(251, 191, 36, 0.5)',
    backgroundColor: 'rgba(251, 191, 36, 0.08)',
  },
  podiumSecond: {
    paddingTop: spacing.lg,
  },
  podiumThird: {
    paddingTop: spacing.md,
  },
  podiumRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  podiumRankText: {
    color: colors.text,
    fontWeight: '600',
  },
  podiumAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  podiumAvatarText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
  podiumName: {
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  podiumPoints: {
    color: colors.softGreen,
    fontSize: 12,
  },
  listSection: {
    gap: spacing.sm,
  },
  listItem: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listName: {
    color: colors.text,
    fontWeight: '600',
  },
  listLevel: {
    color: colors.muted,
    fontSize: 12,
  },
  listPoints: {
    alignItems: 'flex-end',
  },
  pointsValue: {
    color: colors.text,
    fontWeight: '600',
  },
  badgeText: {
    marginTop: spacing.xs,
    fontWeight: '600',
  },
  skeletonWrap: {
    gap: spacing.md,
  },
});
