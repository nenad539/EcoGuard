import { supabase } from './supabase';

const ANALYTICS_TABLE = process.env.EXPO_PUBLIC_ANALYTICS_TABLE ?? 'analytics_events';
const ANALYTICS_ENABLED = process.env.EXPO_PUBLIC_ANALYTICS_ENABLED !== 'false';
let analyticsDisabled = false;

const sanitizePayload = (payload: Record<string, unknown>) => {
  try {
    return JSON.parse(JSON.stringify(payload));
  } catch {
    return {};
  }
};

export const trackEvent = async (event: string, payload: Record<string, unknown> = {}) => {
  if (!ANALYTICS_ENABLED || analyticsDisabled) return;
  try {
    const { data } = await supabase.auth.getUser();
    const userId = data?.user?.id ?? null;
    const { error } = await supabase.from(ANALYTICS_TABLE).insert({
      event_name: event,
      payload: sanitizePayload(payload),
      user_id: userId,
      source: 'mobile',
    });
    if (error) {
      analyticsDisabled = true;
      console.warn('Analytics insert failed', error.message);
    }
  } catch (error) {
    analyticsDisabled = true;
    console.warn('Analytics event failed', error);
  }
};

export const trackScreen = (screen: string, payload: Record<string, unknown> = {}) =>
  trackEvent('screen_view', { screen, ...payload });
