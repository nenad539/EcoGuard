import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { registerForPushNotifications, sendLocalNotification } from '../lib/pushNotifications';

const NOTIFICATIONS_TABLE = 'notifications';

type NotificationPayload = {
  id: string;
  title: string | null;
  body: string | null;
  korisnik_id: string;
  type: string | null;
};

export function NotificationsListener() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      setUserId(data?.user?.id ?? null);
    };
    init();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUserId(session?.user?.id ?? null);
    });

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!userId) return;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setup = async () => {
      await registerForPushNotifications(userId);
      channel = supabase
        .channel('notifications-push')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: NOTIFICATIONS_TABLE, filter: `korisnik_id=eq.${userId}` },
          (payload) => {
            const record = payload.new as NotificationPayload;
            const title = record.title ?? 'Novo obavještenje';
            const body = record.body ?? '';
            sendLocalNotification(title, body);
          }
        )
        .subscribe();
    };

    setup();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [userId]);

  return null;
}
