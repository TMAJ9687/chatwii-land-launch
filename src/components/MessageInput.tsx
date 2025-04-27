
import { useState, useEffect, useCallback } from 'react';
import { Info, Smile } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import EmojiPicker from 'emoji-picker-react';
import { useMessageInput } from '@/hooks/useMessageInput';
import { useImageCounter } from '@/hooks/useImageCounter';
import { useBlockedUsers } from '@/hooks/useBlockedUsers';
import { useVoiceMessage } from '@/hooks/useVoiceMessage';
import { useImageMessage } from '@/hooks/useImageMessage';
import { useMessageActions } from '@/hooks/useMessageActions';
import { ImagePreview } from './chat/ImagePreview';
import { VoicePreview } from './chat/VoicePreview';
import { ReplyComposer } from './chat/ReplyComposer';
import { TextInput } from './chat/input/TextInput';
import { ActionButtons } from './chat/input/ActionButtons';
import { toast } from 'sonner';
import { isMockUser } from '@/utils/mockUsers';
import { debounce } from 'lodash';
import { MessageWithMedia } from '@/types/message';
import { supabase } from '@/lib/supabase';
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
    isReplying,
    replyToMessageId,
    replyContent,
    setReplyContent,
    cancelReply,
    handleReplyToMessage
  } = useMessageActions(currentUserId || '', isVipUser);

  const [replyToMessage, setReplyToMessage] = useState<MessageWithMedia | null>(null);

  useEffect(() => {
    if (!replyToMessageId) {
      setReplyToMessage(null);
      return;
    }
    
    const fetchReplyMessage = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*, message_media(*)')
          .eq('id', replyToMessageId)
          .single();
          
        if (error) throw error;
        
        setReplyToMessage({
          ...data,
          media: data.message_media?.[0] || null,
          reactions: []
        });
      } catch (error) {
        console.error('Error fetching reply message:', error);
      }
    };
    
    fetchReplyMessage();
  }, [replyToMessageId]);

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
    if (isVipUser && (message.length > 0 || replyContent.length > 0)) {
      debouncedTypingStatus(true);
    }
    
    return () => {
      debouncedTypingStatus.cancel();
    };
  }, [message, replyContent, isVipUser, debouncedTypingStatus]);

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

  const handleSendReply = (content: string) => {
    if (!replyToMessageId || !content.trim()) return;
    
    handleReplyToMessage(replyToMessageId, content);
    if (onTypingStatusChange) {
      onTypingStatusChange(false);
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
    <div className="flex flex-col bg-background">
      {isReplying && (
        <ReplyComposer 
          originalMessage={replyToMessage}
          onSendReply={handleSendReply}
          onCancel={cancelReply}
        />
      )}
    
      <div className="p-4 border-t border-border flex gap-2 items-center relative">
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
              disabled={!canSendToUser || isReplying}
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
            !canSendToUser || 
            isReplying
          }
          inputRef={inputRef}
        />

        <ActionButtons
          onEmojiClick={() => {}}
          onAttachmentClick={triggerFileInput}
          onVoiceClick={handleRecordToggle}
          onSendClick={handleSendMessage}
          isRecording={isRecording}
          disabled={!canSendToUser || isReplying}
          sendDisabled={
            (!message.trim() && !selectedFile) || 
            message.length > charLimit || 
            imageUploading || 
            uploadingMessage || 
            isRecording
          }
          isVip={isVipUser}
        />

        {recordingError && (
          <span className="text-destructive text-xs ml-2">{recordingError}</span>
        )}
      </div>
    </div>
  );
};
