
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useAudioUpload = (currentUserId: string | null) => {
  const [isUploading, setIsUploading] = useState(false);

  const uploadAudio = async (audioBlob: Blob) => {
    if (!audioBlob || !currentUserId) return null;
    setIsUploading(true);
    try {
      const fileExt = 'webm';
      const fileName = `${currentUserId}_${Date.now()}.${fileExt}`;
      const filePath = fileName;
      const bucket = 'chat_audio';

      // Upload to audio bucket
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, audioBlob, { upsert: false, contentType: 'audio/webm' });

      if (error) {
        toast.error('Failed to upload audio');
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err) {
      toast.error('Audio upload failed');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return { isUploading, uploadAudio };
};
