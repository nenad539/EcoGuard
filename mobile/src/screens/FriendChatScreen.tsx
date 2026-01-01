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
import { Send } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { supabase } from '../lib/supabase';
import { colors, radius, spacing, gradients } from '../styles/common';
import { GradientBackground } from '../components/common/GradientBackground';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenFade } from '../components/common/ScreenFade';
import { BackButton } from '../components/common/BackButton';
import { EmptyState } from '../components/common/EmptyState';
import { useRealtimeStatus } from '../lib/realtime';
import { showError } from '../lib/toast';
import { useLanguage } from '../lib/language';

const DIRECT_MESSAGES_TABLE = 'direct_messages';
const PAGE_SIZE = 30;

type Message = {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
};

export function FriendChatScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'FriendChat'>>();
  const { friendId, friendName } = route.params;
  const realtimeConnected = useRealtimeStatus();
  const { t } = useLanguage();

  const [userId, setUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [title, setTitle] = useState(friendName ?? t('friendChatDefaultTitle'));
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const loadUser = async () => {
    const { data } = await supabase.auth.getUser();
    setUserId(data?.user?.id ?? null);
  };

  const loadFriend = async () => {
    if (friendName) return;
    const { data } = await supabase
      .from('korisnik_profil')
      .select('korisnicko_ime')
      .eq('id', friendId)
      .maybeSingle();
    if (data?.korisnicko_ime) setTitle(data.korisnicko_ime);
  };

  const loadMessages = async (pageNumber = 1) => {
    if (!userId) return;
    setLoading(true);
    const limit = pageNumber * PAGE_SIZE;
    const { data, error, count } = await supabase
      .from(DIRECT_MESSAGES_TABLE)
      .select('id, sender_id, recipient_id, content, created_at', { count: 'exact' })
      .or(
        `and(sender_id.eq.${userId},recipient_id.eq.${friendId}),and(sender_id.eq.${friendId},recipient_id.eq.${userId})`
      )
      .order('created_at', { ascending: false })
      .range(0, Math.max(0, limit - 1));

    if (error) {
      showError("Gre\u0161ka", t('friendChatLoadError'));
      setLoading(false);
      return;
    }

    const sorted = [...(data ?? [])].reverse() as Message[];
    setMessages(sorted);
    setHasMore(Boolean(count && count > limit));
    if (pageNumber === 1) {
      await markMessagesRead();
    }
    setLoading(false);
  };

  const markMessagesRead = async () => {
    if (!userId) return;
    await supabase
      .from(DIRECT_MESSAGES_TABLE)
      .update({ is_read: true })
      .eq('recipient_id', userId)
      .eq('sender_id', friendId)
      .eq('is_read', false);
  };

  useEffect(() => {
    loadUser();
    loadFriend();
  }, []);

  useEffect(() => {
    if (!userId) return;
    setPage(1);
  }, [userId, friendId]);

  useEffect(() => {
    if (!userId) return;
    loadMessages(page);
  }, [userId, friendId, page]);

  useEffect(() => {
    if (!userId) return;
    const outbound = supabase
      .channel('direct-messages-out')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: DIRECT_MESSAGES_TABLE, filter: `sender_id=eq.${userId}` },
        () => loadMessages(page)
      )
      .subscribe();

    const inbound = supabase
      .channel('direct-messages-in')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: DIRECT_MESSAGES_TABLE, filter: `recipient_id=eq.${userId}` },
        () => loadMessages(page)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(outbound);
      supabase.removeChannel(inbound);
    };
  }, [userId, friendId]);

  useEffect(() => {
    if (!userId || realtimeConnected) return;
    const interval = setInterval(() => {
      loadMessages(page);
    }, 20000);
    return () => clearInterval(interval);
  }, [userId, realtimeConnected, page]);

  const sendMessage = async () => {
    if (!userId) return;
    if (!message.trim()) return;

    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      sender_id: userId,
      recipient_id: friendId,
      content: message.trim(),
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setMessage('');

    const { error } = await supabase.from(DIRECT_MESSAGES_TABLE).insert({
      sender_id: userId,
      recipient_id: friendId,
      content: optimistic.content,
    });

    if (error) {
      showError("Gre\u0161ka", t('friendChatSendError'));
      setMessages((prev) => prev.filter((item) => item.id !== optimistic.id));
      setMessage(optimistic.content);
    }
  };

  const rendered = useMemo(() => {
    return messages.map((msg) => ({
      ...msg,
      isOwn: msg.sender_id === userId,
    }));
  }, [messages, userId]);

  return (
    <GradientBackground>
      <ScreenFade>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
        >
          <BackButton onPress={() => navigation.goBack()} />
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{t('friendChatSubtitle')}</Text>
            </View>
            <View style={styles.statusPill}>
              <Text style={styles.statusText}>{t('friendChatStatusOnline')}</Text>
            </View>
          </View>

          <View style={styles.messagesWrap}>
            <ScrollView contentContainerStyle={styles.messages} keyboardShouldPersistTaps="handled">
            {loading ? <Text style={styles.muted}>{"U\u010ditavanje..."}</Text> : null}
            {!loading && rendered.length === 0 ? (
              <EmptyState
                title={t('friendChatEmptyTitle')}
                description={t('friendChatEmptyDesc')}
              />
            ) : null}
            {hasMore ? (
              <TouchableOpacity onPress={() => setPage((prev) => prev + 1)} style={styles.loadMore}>
                <Text style={styles.loadMoreText}>{t('friendChatLoadMoreLabel')}</Text>
              </TouchableOpacity>
            ) : null}
            {rendered.map((msg) => {
                const timeLabel = msg.created_at ? new Date(msg.created_at).toLocaleTimeString() : '';
                if (msg.isOwn) {
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
                    <Text style={styles.bubbleText}>{msg.content}</Text>
                    <Text style={styles.bubbleTime}>{timeLabel}</Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.inputRow}>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder={t('friendChatPlaceholder')}
              placeholderTextColor={colors.muted}
              style={styles.input}
            />
            <TouchableOpacity onPress={sendMessage} style={styles.sendWrap}>
              <LinearGradient colors={gradients.primary} style={styles.sendButton}>
                <Send size={18} color={colors.text} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </ScreenFade>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '600',
  },
  subtitle: {
    color: colors.muted,
    marginTop: spacing.xs,
    fontSize: 12,
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.35)',
  },
  statusText: {
    color: colors.softGreen,
    fontSize: 12,
    fontWeight: '600',
  },
  messagesWrap: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.4)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  messages: {
    flexGrow: 1,
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  bubble: {
    maxWidth: '85%',
    padding: spacing.sm,
    borderRadius: radius.md,
  },
  bubbleOwn: {
    alignSelf: 'flex-end',
  },
  bubbleOther: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    alignSelf: 'flex-start',
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  input: {
    flex: 1,
    backgroundColor: colors.cardAlt,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.6)',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
  },
  sendWrap: {
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  sendButton: {
    padding: 14,
    borderRadius: radius.md,
  },
  muted: {
    color: colors.muted,
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
});
