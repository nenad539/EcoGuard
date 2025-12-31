import { supabase } from './supabase';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

const DEFAULT_BUCKET = 'photo-challenge-submissions';
const imageCache = new Map<string, string>();

const compressImage = async (uri: string) => {
  if (imageCache.has(uri)) {
    return imageCache.get(uri) as string;
  }

  const result = await manipulateAsync(
    uri,
    [{ resize: { width: 1280 } }],
    { compress: 0.7, format: SaveFormat.JPEG }
  );
  imageCache.set(uri, result.uri);
  return result.uri;
};

export const uploadPhotoChallenge = async (params: {
  uri: string;
  userId: string;
  challengeId: number;
  onProgress?: (value: number) => void;
}) => {
  const { uri, userId, challengeId, onProgress } = params;
  if (!uri) throw new Error('Nedostaje URI fotografije.');

  onProgress?.(0.1);
  const processedUri = await compressImage(uri);
  onProgress?.(0.2);

  const contentType = 'image/jpeg';
  const base64 = await FileSystem.readAsStringAsync(processedUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const body = decode(base64);

  onProgress?.(0.4);

  const extension = 'jpg';
  const filePath = `${userId}/${challengeId}/${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(DEFAULT_BUCKET)
    .upload(filePath, body, { upsert: true, contentType });

  if (uploadError) throw uploadError;
  onProgress?.(0.75);

  const { data } = supabase.storage.from(DEFAULT_BUCKET).getPublicUrl(filePath);
  if (!data?.publicUrl) {
    throw new Error('Public URL nije dostupan.');
  }
  onProgress?.(0.9);

  return { publicUrl: data.publicUrl, path: filePath };
};
