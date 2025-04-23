
import { useState } from 'react';
import { useVoiceRecorder } from './useVoiceRecorder';
import { useAudioUpload } from './useAudioUpload';
import { toast } from 'sonner';

export const useVoiceMessage = (currentUserId: string | null, canSendToUser: boolean) => {
  const [showVoicePreview, setShowVoicePreview] = useState(false);
  
  const {
    isRecording,
    audioBlob,
    error: recordingError,
    mediaUrl: localAudioUrl,
    startRecording,
    stopRecording,
    clearRecording
  } = useVoiceRecorder();

  const { isUploading: audioUploading, uploadAudio } = useAudioUpload(currentUserId);

  const handleRecordToggle = async () => {
    if (!canSendToUser) {
      toast.error("You cannot send messages to this user");
      return;
    }

    if (isRecording) {
      stopRecording();
      setShowVoicePreview(true);
    } else {
      clearRecording();
      setShowVoicePreview(false);
      await startRecording();
    }
  };

  const handleSendVoice = async () => {
    if (!canSendToUser) {
      toast.error("You cannot send messages to this user");
      return;
    }

    if (!audioBlob) return;
    if (audioBlob.size > 1.5 * 1024 * 1024) {
      toast.error('Voice message is too large (max 1.5MB).');
      return;
    }
    if (!currentUserId) {
      toast.error('Not logged in');
      return;
    }

    const publicUrl = await uploadAudio(audioBlob);
    if (!publicUrl) return null;

    return publicUrl + '?t=' + Date.now();
  };

  const handleCancelVoice = () => {
    clearRecording();
    setShowVoicePreview(false);
  };

  return {
    isRecording,
    audioBlob,
    recordingError,
    localAudioUrl,
    showVoicePreview,
    audioUploading,
    handleRecordToggle,
    handleSendVoice,
    handleCancelVoice
  };
};
