
import { Send, Smile, Paperclip, Mic, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import EmojiPicker from 'emoji-picker-react';
import { useMessageInput } from '@/hooks/useMessageInput';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { useAudioUpload } from '@/hooks/useAudioUpload';
import { VoiceMessagePlayer } from './VoiceMessagePlayer';
import { useImageCounter } from '@/hooks/useImageCounter';
import { useBlockedUsers } from '@/hooks/useBlockedUsers';

interface MessageInputProps {
  onSendMessage: (content: string, imageUrl?: string) => void;
  currentUserId: string | null;
  receiverId: string;
}

export const MessageInput = ({ onSendMessage, currentUserId, receiverId }: MessageInputProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingMessage, setUploadingMessage] = useState(false);
  
  const {
    message,
    setMessage,
    charLimit,
    inputRef,
    handleSend,
    handleKeyPress,
    handleEmojiClick
  } = useMessageInput({ onSendMessage });

  const { canInteractWithUser } = useBlockedUsers();

  // Check if user can interact with the recipient
  const canSendToUser = canInteractWithUser(receiverId);

  const {
    selectedFile,
    previewUrl,
    isUploading: imageUploading,
    handleFileSelect,
    uploadImage,
    clearFileSelection,
    checkDailyUploadLimit,
    updateDailyUploadCount
  } = useImageUpload(currentUserId);

  // Image counter hook
  const { 
    imagesUsedToday, 
    dailyLimit, 
    isVip, 
    remainingImages,
    hasReachedLimit
  } = useImageCounter(currentUserId);

  // --- Voice message state/handlers
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

  const [showVoicePreview, setShowVoicePreview] = useState(false);

  // Modified handleSend to check for blocking
  const handleSendMessage = async () => {
    if (!canSendToUser) {
      toast.error("You cannot send messages to this user");
      return;
    }
    
    // If there's text, send it
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
      return;
    }
    
    // If there's an image, send it
    if (selectedFile) {
      if (hasReachedLimit && !isVip) {
        toast.error(`You've reached your daily limit of ${dailyLimit} images`);
        return;
      }
      
      setUploadingMessage(true);
      
      try {
        const canUpload = await checkDailyUploadLimit();
        if (!canUpload && !isVip) {
          toast.error(`You've reached your daily limit of ${dailyLimit} images`);
          setUploadingMessage(false);
          return;
        }
        
        const imageUrl = await uploadImage();
        if (imageUrl) {
          onSendMessage("", imageUrl);
          await updateDailyUploadCount();
          clearFileSelection();
        }
      } catch (error) {
        console.error('Error uploading image:', error);
        toast.error('Failed to upload image');
      } finally {
        setUploadingMessage(false);
      }
    }
  };

  // Handler: voice record mic button
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

  // Handler: send audio
  const handleSendVoice = async () => {
    if (!canSendToUser) {
      toast.error("You cannot send messages to this user");
      return;
    }

    if (!audioBlob) return;
    // Size/duration check (e.g., max 1.5MB, optionally add duration limit check)
    if (audioBlob.size > 1.5 * 1024 * 1024) {
      toast.error('Voice message is too large (max 1.5MB).');
      return;
    }
    if (!currentUserId) {
      toast.error('Not logged in');
      return;
    }
    setUploadingMessage(true);
    const publicUrl = await uploadAudio(audioBlob);
    if (!publicUrl) {
      setUploadingMessage(false);
      return;
    }
    // Send message with placeholder [Voice message] and pass audio url
    onSendMessage('[Voice message]', publicUrl + '?t=' + Date.now());
    setUploadingMessage(false);
    clearRecording();
    setShowVoicePreview(false);
    toast.success('Voice message sent!');
  };

  // Handler: manual cancel preview
  const handleCancelVoice = () => {
    clearRecording();
    setShowVoicePreview(false);
  };

  const triggerFileInput = () => {
    if (!canSendToUser) {
      toast.error("You cannot send messages to this user");
      return;
    }

    if (hasReachedLimit && !isVip) {
      toast.error(`You've reached your daily limit of ${dailyLimit} images`);
      return;
    }

    fileInputRef.current?.click();
  };

  // UI rendering
  return (
    <div className="p-4 border-t border-border flex gap-2 items-center bg-background relative">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Image preview */}
      {previewUrl && (
        <div className="absolute bottom-full left-0 p-2 bg-background border rounded-t-lg flex items-center">
          <img 
            src={previewUrl} 
            alt="Image preview" 
            className="w-20 h-20 object-cover rounded mr-2" 
          />
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={clearFileSelection}
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Voice preview */}
      {showVoicePreview && audioBlob && localAudioUrl && (
        <div className="absolute bottom-full left-0 p-2 bg-background border rounded-t-lg flex items-center gap-2 z-10">
          <VoiceMessagePlayer src={localAudioUrl} />
          <Button
            variant="outline"
            size="sm"
            onClick={handleSendVoice}
            disabled={audioUploading || uploadingMessage}
          >
            Send
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleCancelVoice}
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Image counter for non-VIP users */}
      {!isVip && (
        <div className="absolute bottom-full right-0 bg-background border rounded-t-lg px-3 py-1 text-xs text-muted-foreground">
          Images: {imagesUsedToday}/{dailyLimit}
        </div>
      )}

      {/* Emoji & media actions */}
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
        className={`rounded-full transition-all duration-200 ${isRecording ? 'animate-pulse' : ''}`}
        onClick={handleRecordToggle}
        disabled={imageUploading || audioUploading || uploadingMessage || !canSendToUser}
        aria-label={isRecording ? "Stop recording" : "Start recording"}
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
