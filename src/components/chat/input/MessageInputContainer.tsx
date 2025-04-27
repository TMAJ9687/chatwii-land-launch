import React, { useState, useEffect, useCallback } from 'react';
import { Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { debounce } from 'lodash';
import EmojiPicker from 'emoji-picker-react';
import { toast } from 'sonner';
import { useBlockedUsers } from '@/hooks/useBlockedUsers';
import { useVoiceMessage } from '@/hooks/useVoiceMessage';
import { useImageMessage } from '@/hooks/useImageMessage';
import { useMessageInput } from '@/hooks/useMessageInput';
import { ImagePreview } from '../ImagePreview';
import { VoicePreview } from '../VoicePreview';
import { TextInput } from './TextInput';
import { SendButton } from './SendButton';
import { AttachmentButton } from './AttachmentButton';
import { VoiceRecorderButton } from './VoiceRecorderButton';
import { isMockUser } from '@/utils/mockUsers';

interface MessageInputContainerProps {
  onSendMessage: (content: string, imageUrl?: string) => void;
  currentUserId: string | null;
  receiverId: string;
  isVipUser?: boolean;
  onTypingStatusChange?: (isTyping: boolean) => void;
}

export const MessageInputContainer: React.FC<MessageInputContainerProps> = ({ 
  onSendMessage, 
  currentUserId, 
  receiverId,
  isVipUser = false,
  onTypingStatusChange 
}) => {
  const [uploadingMessage, setUploadingMessage] = useState(false);
  const { canInteractWithUser } = useBlockedUsers();
  const canSendToUser = canInteractWithUser(receiverId);
  const isMockVipUser = isMockUser(receiverId);
  
  const [hasReachedImageLimit, setHasReachedImageLimit] = useState(false);
  const dailyImageLimit = 10;

  const {
    message,
    setMessage,
    charLimit,
    inputRef,
    handleKeyPress,
    handleEmojiClick
  } = useMessageInput({ onSendMessage });

  const {
    isRecording,
    audioBlob,
    recordingError,
    localAudioUrl,
    showVoicePreview,
    audioUploading,
    handleRecordToggle,
    handleSendVoice,
    handleCancelVoice
  } = useVoiceMessage(currentUserId, canSendToUser && !isMockVipUser);

  const {
    fileInputRef,
    selectedFile,
    previewUrl,
    imageUploading,
    handleFileSelect,
    clearFileSelection,
    triggerFileInput,
    handleImageUpload
  } = useImageMessage(
    currentUserId, 
    canSendToUser && !isMockVipUser,
    hasReachedImageLimit,
    isVipUser,
    dailyImageLimit
  );

  const debouncedTypingStatus = useCallback(
    debounce((isTyping: boolean) => {
      if (onTypingStatusChange) {
        onTypingStatusChange(isTyping);
      }
    }, 300),
    [onTypingStatusChange]
  );

  useEffect(() => {
    if (isVipUser && message.length > 0) {
      debouncedTypingStatus(true);
    }
    
    return () => {
      debouncedTypingStatus.cancel();
    };
  }, [message, isVipUser, debouncedTypingStatus]);

  useEffect(() => {
    return () => {
      if (isVipUser && onTypingStatusChange) {
        onTypingStatusChange(false);
      }
    };
  }, [isVipUser, onTypingStatusChange]);

  const handleSendMessage = async () => {
    if (isMockVipUser) {
      toast.error("This is a demo VIP user. You cannot send messages to this account.");
      return;
    }
    
    if (!canSendToUser) {
      toast.error("You cannot send messages to this user");
      return;
    }
    
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
      if (onTypingStatusChange) {
        onTypingStatusChange(false);
      }
      return;
    }
    
    if (selectedFile) {
      setUploadingMessage(true);
      try {
        const imageUrl = await handleImageUpload();
        if (imageUrl) {
          onSendMessage("", imageUrl);
          if (onTypingStatusChange) {
            onTypingStatusChange(false);
          }
        }
      } catch (error) {
        console.error('Error uploading image:', error);
        toast.error('Failed to upload image');
      } finally {
        setUploadingMessage(false);
      }
    }
  };

  const handleSendVoiceMessage = async () => {
    if (isMockVipUser) {
      toast.error("This is a demo VIP user. You cannot send messages to this account.");
      return;
    }
    
    setUploadingMessage(true);
    try {
      const voiceUrl = await handleSendVoice();
      if (voiceUrl) {
        onSendMessage('[Voice message]', voiceUrl);
        handleCancelVoice();
        if (onTypingStatusChange) {
          onTypingStatusChange(false);
        }
      }
    } finally {
      setUploadingMessage(false);
    }
  };

  return (
    <div className="p-4 border-t border-border flex gap-2 items-center bg-background relative">
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {previewUrl && <ImagePreview previewUrl={previewUrl} onCancel={clearFileSelection} />}

      {showVoicePreview && audioBlob && localAudioUrl && (
        <VoicePreview 
          audioUrl={localAudioUrl}
          onSend={handleSendVoiceMessage}
          onCancel={handleCancelVoice}
          disabled={audioUploading || uploadingMessage}
        />
      )}

      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full"
            disabled={!canSendToUser || isRecording}
          >
            <Smile className="h-5 w-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" sideOffset={5} align="start">
          <EmojiPicker onEmojiClick={handleEmojiClick} />
        </PopoverContent>
      </Popover>

      <TextInput
        message={message}
        charLimit={charLimit}
        onChange={setMessage}
        onKeyPress={handleKeyPress}
        disabled={
          imageUploading || 
          uploadingMessage || 
          isRecording || 
          !canSendToUser
        }
        inputRef={inputRef}
      />

      <AttachmentButton
        onClick={triggerFileInput}
        disabled={!canSendToUser || isRecording}
      />

      <VoiceRecorderButton
        isRecording={isRecording}
        onClick={handleRecordToggle}
        disabled={!canSendToUser}
      />

      <SendButton
        onClick={handleSendMessage}
        disabled={
          (!message.trim() && !selectedFile) || 
          message.length > charLimit || 
          imageUploading || 
          uploadingMessage || 
          isRecording
        }
      />

      {recordingError && (
        <span className="text-destructive text-xs ml-2">{recordingError}</span>
      )}
    </div>
  );
};
