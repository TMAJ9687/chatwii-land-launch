
import { useState, useEffect, useCallback } from 'react';
import { Send, Smile, Paperclip, Mic, Info } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import EmojiPicker from 'emoji-picker-react';
import { useMessageInput } from '@/hooks/useMessageInput';
import { useImageCounter } from '@/hooks/useImageCounter';
import { useBlockedUsers } from '@/hooks/useBlockedUsers';
import { useVoiceMessage } from '@/hooks/useVoiceMessage';
import { useImageMessage } from '@/hooks/useImageMessage';
import { ImagePreview } from './chat/ImagePreview';
import { VoicePreview } from './chat/VoicePreview';
import { toast } from 'sonner';
import { isMockUser } from '@/utils/mockUsers';
import { debounce } from 'lodash';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MessageInputProps {
  onSendMessage: (content: string, imageUrl?: string) => void;
  currentUserId: string | null;
  receiverId: string;
  isVipUser?: boolean;
  onTypingStatusChange?: (isTyping: boolean) => void;
}

export const MessageInput = ({ 
  onSendMessage, 
  currentUserId, 
  receiverId,
  isVipUser = false,
  onTypingStatusChange 
}: MessageInputProps) => {
  const [uploadingMessage, setUploadingMessage] = useState(false);
  const { canInteractWithUser } = useBlockedUsers();
  const canSendToUser = canInteractWithUser(receiverId);
  const isMockVipUser = isMockUser(receiverId);

  const {
    message,
    setMessage,
    charLimit,
    inputRef,
    handleKeyPress,
    handleEmojiClick
  } = useMessageInput({ onSendMessage });

  const { 
    imagesUsedToday, 
    dailyLimit, 
    isVip, 
    hasReachedLimit
  } = useImageCounter(currentUserId);

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
  } = useImageMessage(currentUserId, canSendToUser && !isMockVipUser, hasReachedLimit, isVip, dailyLimit);

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
      const timeout = setTimeout(() => {
        debouncedTypingStatus(false);
      }, 5000);
      
      return () => clearTimeout(timeout);
    }
  }, [message, isVipUser, debouncedTypingStatus]);

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
      return;
    }
    
    if (selectedFile) {
      setUploadingMessage(true);
      try {
        const imageUrl = await handleImageUpload();
        if (imageUrl) {
          onSendMessage("", imageUrl);
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
      }
    } finally {
      setUploadingMessage(false);
    }
  };

  if (isMockVipUser) {
    return (
      <div className="p-4 border-t border-border flex gap-2 items-center bg-background relative">
        <Input
          value="This is a demo VIP user. You cannot send messages to this account."
          disabled
          className="flex-1 bg-gray-100 dark:bg-gray-800 text-muted-foreground"
        />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Info className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              This is a demo VIP user created to showcase the VIP features.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

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

      {!isVip && (
        <div className="absolute bottom-full right-0 bg-background border rounded-t-lg px-3 py-1 text-xs text-muted-foreground">
          Images: {imagesUsedToday}/{dailyLimit}
        </div>
      )}

      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full"
            disabled={!canSendToUser}
          >
            <Smile className="h-5 w-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" sideOffset={5} align="start">
          <EmojiPicker onEmojiClick={handleEmojiClick} />
        </PopoverContent>
      </Popover>

      <Button 
        variant={isRecording ? "destructive" : "ghost"}
        size="icon"
        className={`rounded-full transition-all duration-200 ${
          !isVip ? 'opacity-50 cursor-not-allowed' : ''
        } ${isRecording ? 'animate-pulse' : ''}`}
        onClick={handleRecordToggle}
        disabled={imageUploading || audioUploading || uploadingMessage || !canSendToUser || !isVip}
        title={!isVip ? "VIP-only feature" : "Record voice message"}
      >
        <Mic className="h-5 w-5" />
      </Button>

      <Button 
        variant="ghost" 
        size="icon" 
        className="rounded-full"
        onClick={triggerFileInput}
        disabled={imageUploading || uploadingMessage || isRecording || hasReachedLimit || !canSendToUser}
      >
        <Paperclip className="h-5 w-5" />
      </Button>
      
      <div className="flex-1 relative">
        <Input
          ref={inputRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={canSendToUser ? "Type a message..." : "You cannot message this user"}
          className="pr-16"
          maxLength={charLimit}
          disabled={imageUploading || uploadingMessage || isRecording || !canSendToUser}
        />
        <div className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${
          message.length > charLimit ? 'text-destructive' : 'text-muted-foreground'
        }`}>
          {message.length}/{charLimit}
        </div>
      </div>
      
      <Button 
        onClick={handleSendMessage}
        size="icon"
        className="rounded-full"
        disabled={(!message.trim() && !selectedFile) || message.length > charLimit || imageUploading || uploadingMessage || isRecording || !canSendToUser}
      >
        <Send className="h-5 w-5" />
      </Button>

      {recordingError && (
        <span className="text-destructive text-xs ml-2">{recordingError}</span>
      )}
    </div>
  );
};
