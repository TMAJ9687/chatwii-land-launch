
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
import { useMessageActions } from '@/hooks/useMessageActions';
import { ImagePreview } from './chat/ImagePreview';
import { VoicePreview } from './chat/VoicePreview';
import { ReplyComposer } from './chat/ReplyComposer';
import { toast } from 'sonner';
import { isMockUser } from '@/utils/mockUsers';
import { debounce } from 'lodash';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from '@/lib/supabase';
import { MessageWithMedia } from '@/types/message';

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

  // Fetch reply message details if needed
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

  // Force typing indicator to false when component unmounts
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
      // Reset typing indicator
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
          // Reset typing indicator
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
    // Reset typing indicator
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
        // Reset typing indicator
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
      {/* Reply composer if in reply mode */}
      {isReplying && (
        <ReplyComposer 
          originalMessage={replyToMessage}
          onSendReply={handleSendReply}
          onCancel={cancelReply}
        />
      )}
    
      {/* Regular message input */}
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

        <Button 
          variant={isRecording ? "destructive" : "ghost"}
          size="icon"
          className={`rounded-full transition-all duration-200 ${
            !isVip ? 'opacity-50 cursor-not-allowed' : ''
          } ${isRecording ? 'animate-pulse' : ''}`}
          onClick={handleRecordToggle}
          disabled={imageUploading || audioUploading || uploadingMessage || !canSendToUser || !isVip || isReplying}
          title={!isVip ? "VIP-only feature" : "Record voice message"}
        >
          <Mic className="h-5 w-5" />
        </Button>

        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full"
          onClick={triggerFileInput}
          disabled={imageUploading || uploadingMessage || isRecording || hasReachedLimit || !canSendToUser || isReplying}
        >
          <Paperclip className="h-5 w-5" />
        </Button>
        
        <div className="flex-1 relative">
          {!isReplying ? (
            <>
              <Input
                ref={inputRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={canSendToUser ? "Type a message..." : "You cannot message this user"}
                className="pr-16"
                maxLength={charLimit}
                disabled={imageUploading || uploadingMessage || isRecording || !canSendToUser || isReplying}
              />
              <div className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${
                message.length > charLimit ? 'text-destructive' : 'text-muted-foreground'
              }`}>
                {message.length}/{charLimit}
              </div>
            </>
          ) : (
            <div className="h-10 flex items-center px-3 bg-muted/40 rounded-md text-sm text-muted-foreground">
              Composing reply...
            </div>
          )}
        </div>
        
        <Button 
          onClick={handleSendMessage}
          size="icon"
          className="rounded-full"
          disabled={(
            (!message.trim() && !selectedFile) || 
            message.length > charLimit || 
            imageUploading || 
            uploadingMessage || 
            isRecording || 
            !canSendToUser || 
            isReplying
          )}
        >
          <Send className="h-5 w-5" />
        </Button>

        {recordingError && (
          <span className="text-destructive text-xs ml-2">{recordingError}</span>
        )}
      </div>
    </div>
  );
};
