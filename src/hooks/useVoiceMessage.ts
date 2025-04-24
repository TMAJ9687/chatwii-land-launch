
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
      try {
        await startRecording();
      } catch (error) {
        toast.error("Could not access microphone");
        console.error("Recording error:", error);
      }
    }
  };

  const handleSendVoice = async () => {
    if (!canSendToUser) {
      toast.error("You cannot send messages to this user");
      return null;
    }

    if (!audioBlob) return null;
    if (audioBlob.size > 1.5 * 1024 * 1024) {
      toast.error('Voice message is too large (max 1.5MB).');
      return null;
    }
    if (!currentUserId) {
      toast.error('Not logged in');
      return null;
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
    setShowVoicePreview,
    audioUploading,
    handleRecordToggle,
    handleSendVoice,
    handleCancelVoice,
    startRecording,
    stopRecording,
    clearRecording
  };
};
