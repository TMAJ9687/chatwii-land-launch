
import { useState } from 'react';
import { uploadFile } from '@/lib/firebase';
import { toast } from 'sonner';

export const useAudioUpload = (currentUserId: string | null) => {
  const [isUploading, setIsUploading] = useState(false);

  const uploadAudio = async (audioBlob: Blob) => {
    if (!audioBlob || !currentUserId) return null;
    setIsUploading(true);
    try {
      const fileExt = 'webm';
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${currentUserId}/${fileName}`;

      const { url } = await uploadFile(
        'chat_audio',
        filePath,
        audioBlob,
        'audio/webm'
      );

      return url;
    } catch (err) {
      toast.error('Audio upload failed');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return { isUploading, uploadAudio };
};
