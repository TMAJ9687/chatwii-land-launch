
import { useRef, useState } from 'react';

export const useVoiceRecorder = (userId?: string | null) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Your browser does not support audio recording.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setMediaUrl(URL.createObjectURL(blob));
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      setError('Could not access microphone.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const clearRecording = () => {
    setAudioBlob(null);
    setMediaUrl(null);
    setError(null);
    setIsRecording(false);
    chunksRef.current = [];
    if (mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current?.stop();
    }
  };

  // Adding a mock upload function since it's being referenced but wasn't defined
  const uploadVoiceMessage = async (): Promise<string | null> => {
    if (!audioBlob) return null;
    // This would normally upload to a server or storage service
    // For now just return a mock URL
    return mediaUrl;
  };

  // Renaming to be consistent with usage
  const resetRecording = clearRecording;
  
  // For compatibility with what's being used in MessageInputContainer
  const audioUrl = mediaUrl;

  return {
    isRecording,
    audioBlob,
    error,
    mediaUrl,
    audioUrl, // Added alias
    startRecording,
    stopRecording,
    clearRecording,
    resetRecording, // Added alias
    uploadVoiceMessage // Added missing function
  };
};
