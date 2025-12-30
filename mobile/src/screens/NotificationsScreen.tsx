import React, { useEffect, useState } from 'react';
import { ScrollView, Text, StyleSheet, View, TouchableOpacity } from 'react-native';
import { supabase } from '../lib/supabase';
import { colors, radius, spacing } from '../styles/common';
import { GradientBackground } from '../components/common/GradientBackground';

const NOTIFICATIONS_TABLE = 'notifications';

type NotificationItem = {
  id: string;
  title: string | null;
  body: string | null;
  type: string | null;
  status: string | null;
  created_at: string | null;
};

export function NotificationsScreen() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = async () => {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth?.user?.id;
    if (!userId) return;

    const { data, error } = await supabase
      .from(NOTIFICATIONS_TABLE)
      .select('id, title, body, type, status, created_at')
      .eq('korisnik_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      setError('Greška pri učitavanju obavještenja.');
      return;
    }

    setItems((data ?? []) as NotificationItem[]);
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    const setup = async () => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id;
      if (!userId) return;
      channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: NOTIFICATIONS_TABLE, filter: `korisnik_id=eq.${userId}` },
          () => loadNotifications()
        )
        .subscribe();
    };
    setup();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      loadNotifications();
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  const markRead = async (id: string) => {
    await supabase.from(NOTIFICATIONS_TABLE).update({ status: 'read' }).eq('id', id);
    loadNotifications();
  };

  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>Obavještenja</Text>
      {error && <Text style={styles.error}>{error}</Text>}

      {items.length === 0 ? (
        <Text style={styles.muted}>Nema obavještenja.</Text>
      ) : (
        items.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.card, item.status === 'unread' && styles.cardUnread]}
            onPress={() => markRead(item.id)}
          >
            <Text style={styles.cardTitle}>{item.title ?? 'Obavještenje'}</Text>
            {item.body ? <Text style={styles.cardBody}>{item.body}</Text> : null}
            <Text style={styles.cardMeta}>
              {item.created_at ? new Date(item.created_at).toLocaleString() : ''}
            </Text>
          </TouchableOpacity>
        ))
      )}
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
    marginBottom: spacing.md,
  },
  error: {
    color: colors.danger,
    marginBottom: spacing.sm,
  },
  muted: {
    color: colors.muted,
  },
  card: {
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardUnread: {
    borderColor: colors.primary,
    borderWidth: 1,
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
});
