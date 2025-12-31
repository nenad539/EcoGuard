import { supabase } from './supabase';

const DEFAULT_BUCKET = 'photo-challenge-submissions';

export const uploadPhotoChallenge = async (params: {
  uri: string;
  userId: string;
  challengeId: number;
  onProgress?: (value: number) => void;
}) => {
  const { uri, userId, challengeId, onProgress } = params;
  if (!uri) throw new Error('Nedostaje URI fotografije.');

  onProgress?.(0.1);
  const response = await fetch(uri);
  const blob = await response.blob();
  onProgress?.(0.4);

  const extension = uri.split('.').pop() ?? 'jpg';
  const filePath = `${userId}/${challengeId}/${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(DEFAULT_BUCKET)
    .upload(filePath, blob, { upsert: true, contentType: blob.type || 'image/jpeg' });

  if (uploadError) throw uploadError;
  onProgress?.(0.75);

  const { data } = supabase.storage.from(DEFAULT_BUCKET).getPublicUrl(filePath);
  if (!data?.publicUrl) {
    throw new Error('Public URL nije dostupan.');
  }
  onProgress?.(0.9);

  return { publicUrl: data.publicUrl, path: filePath };
};
