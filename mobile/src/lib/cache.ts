import AsyncStorage from '@react-native-async-storage/async-storage';

type CacheEntry<T> = {
  value: T;
  timestamp: number;
};

export const getCached = async <T>(key: string, maxAgeMs: number) => {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry<T>;
    if (!parsed || typeof parsed.timestamp !== 'number') return null;
    const isStale = Date.now() - parsed.timestamp > maxAgeMs;
    return { value: parsed.value, isStale };
  } catch (error) {
    console.warn('Cache read failed', error);
    return null;
  }
};

export const setCached = async <T>(key: string, value: T) => {
  try {
    const payload: CacheEntry<T> = { value, timestamp: Date.now() };
    await AsyncStorage.setItem(key, JSON.stringify(payload));
  } catch (error) {
    console.warn('Cache write failed', error);
  }
};
