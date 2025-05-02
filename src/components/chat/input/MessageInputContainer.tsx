import React, { useState, useEffect, useRef } from 'react';
import { TextInput } from './TextInput';
import { SendButton } from './SendButton';
import { AttachmentButton } from './AttachmentButton';
import { VoiceRecorderButton } from './VoiceRecorderButton';
import { ActionButtons } from './ActionButtons';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { ImagePreview } from '../ImagePreview';
import { VoicePreview } from '../VoicePreview';
import { useMessageValidation } from '@/hooks/useMessageValidation';

interface MessageInputContainerProps {
  onSendMessage: (content: string, imageUrl?: string) => void;
  currentUserId: string | null;
  receiverId: string;
  isVipUser?: boolean;
  onTypingStatusChange?: (isTyping: boolean) => void;
  disabled?: boolean;
}

export const MessageInputContainer: React.FC<MessageInputContainerProps> = ({
  onSendMessage,
  currentUserId,
  receiverId,
  isVipUser = false,
  onTypingStatusChange,
  disabled = false
}) => {
  const [message, setMessage] = useState('');
  const { validateMessage } = useMessageValidation();
  const messageInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Image Upload
  const {
    previewUrl,
    selectedFile,
    isUploading,
    uploadError,
    handleFileSelect,
    uploadImage,
    clearFileSelection
  } = useImageUpload(currentUserId);

  // Voice Recorder
  const {
    isRecording,
    audioBlob,
    audioUrl,
    startRecording,
    stopRecording,
    resetRecording,
    uploadVoiceMessage
  } = useVoiceRecorder(currentUserId);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  // Handle typing status change
  const handleTypingStatus = (isTyping: boolean) => {
    if (onTypingStatusChange) onTypingStatusChange(isTyping);
  };

  const handleInputChange = (value: string) => {
    setMessage(value);
    handleTypingStatus(value.length > 0);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      handleTypingStatus(false);
    }, 1500);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSend = async () => {
    if (disabled) return;

    // Voice
    if (audioBlob) {
      try {
        const voiceUrl = await uploadVoiceMessage();
        if (voiceUrl) {
          onSendMessage('', voiceUrl);
          resetRecording();
          handleTypingStatus(false);
        }
      } catch (error) {
        console.error('Error uploading voice message:', error);
      }
      return;
    }

    // Image
    if (selectedFile) {
      try {
        const imageUrl = await uploadImage();
        if (imageUrl) {
          onSendMessage(message, imageUrl);
          setMessage('');
          clearFileSelection();
          handleTypingStatus(false);
        }
      } catch (error) {
        console.error('Error uploading image:', error);
      }
      return;
    }

    // Text
    if (message.trim()) {
      const { valid } = validateMessage(message);
      if (valid) {
        onSendMessage(message);
        setMessage('');
        handleTypingStatus(false);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !disabled) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-2 border-t flex flex-col gap-2">
      {/* Hidden file input for attachments */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        accept="image/*"
      />

      {/* Image Preview */}
      {previewUrl && (
        <ImagePreview 
          previewUrl={previewUrl} 
          onCancel={clearFileSelection} 
        />
      )}

      {/* Voice Preview */}
      {audioUrl && !isRecording && (
        <VoicePreview 
          audioUrl={audioUrl} 
          onSend={handleSend}
          onCancel={resetRecording} 
          disabled={disabled}
        />
      )}

      <div className="flex items-end gap-2">
        {!isRecording && !audioBlob && (
          <AttachmentButton 
            onClick={triggerFileInput}
            disabled={disabled || !!audioBlob}
          />
        )}

        <TextInput 
          value={message}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          disabled={isRecording || disabled}
          ref={messageInputRef}
        />

        {!isRecording && !audioBlob && (
          <SendButton 
            onClick={handleSend} 
            disabled={disabled || (!message.trim() && !selectedFile)}
          />
        )}

        {!isRecording && !audioBlob && !selectedFile && !message.trim() && (
          <VoiceRecorderButton
            isRecording={isRecording}
            onClick={startRecording}
            disabled={disabled}
          />
        )}

        {isRecording && (
          <ActionButtons 
            onStop={stopRecording} 
            onCancel={resetRecording}
            disabled={disabled}
          />
        )}
      </div>
    </div>
  );
};
