
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
import { isMockUser } from '@/utils/mockUsers';

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
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { 
    selectedImage, 
    imagePreview, 
    handleImageSelect, 
    cancelImageSelection, 
    uploadSelectedImage 
  } = useImageUpload(currentUserId);

  const { 
    isRecording,
    audioBlob,
    audioUrl,
    startRecording,
    stopRecording,
    resetRecording,
    uploadVoiceMessage
  } = useVoiceRecorder(currentUserId);

  const handleTypingStatus = (isTyping: boolean) => {
    if (onTypingStatusChange) {
      onTypingStatusChange(isTyping);
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleInputChange = (value: string) => {
    setMessage(value);
    
    // Notify that the user is typing
    handleTypingStatus(value.length > 0);
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set timeout to indicate typing stopped after 1.5 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      handleTypingStatus(false);
    }, 1500);
  };

  const handleSend = async () => {
    if (disabled) return;
    
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

    if (selectedImage) {
      try {
        const imageUrl = await uploadSelectedImage();
        if (imageUrl) {
          onSendMessage(message, imageUrl);
          setMessage('');
          cancelImageSelection();
          handleTypingStatus(false);
        }
      } catch (error) {
        console.error('Error uploading image:', error);
      }
      return;
    }

    if (message.trim()) {
      const { isValid } = validateMessage(message);
      if (isValid) {
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
      {imagePreview && (
        <ImagePreview 
          imageUrl={imagePreview} 
          onCancel={cancelImageSelection} 
        />
      )}
      
      {audioUrl && !isRecording && (
        <VoicePreview 
          audioUrl={audioUrl} 
          onCancel={resetRecording} 
        />
      )}
      
      <div className="flex items-end gap-2">
        {!isRecording && !audioBlob && (
          <AttachmentButton 
            onImageSelect={handleImageSelect} 
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
            disabled={disabled || (!message.trim() && !selectedImage)}
          />
        )}
        
        {!isRecording && !audioBlob && !selectedImage && !message.trim() && (
          <VoiceRecorderButton
            isRecording={isRecording}
            onStartRecording={startRecording}
            onStopRecording={stopRecording}
            disabled={disabled}
          />
        )}
        
        {isRecording && (
          <ActionButtons 
            onStop={stopRecording} 
            onCancel={() => {
              resetRecording();
              handleTypingStatus(false);
            }}
            disabled={disabled}
          />
        )}
      </div>
    </div>
  );
};
