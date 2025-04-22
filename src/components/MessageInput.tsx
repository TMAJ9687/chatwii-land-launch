import { Send, Smile, Paperclip } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import EmojiPicker from 'emoji-picker-react';
import { useMessageInput } from '@/hooks/useMessageInput';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface MessageInputProps {
  onSendMessage: (content: string, imageUrl?: string) => void;
  currentUserId: string | null;
}

export const MessageInput = ({ onSendMessage, currentUserId }: MessageInputProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingMessage, setUploadingMessage] = useState(false);
  
  const {
    message,
    setMessage,
    charLimit,
    inputRef,
    handleSend,
    handleTextSend,
    handleKeyPress,
    handleEmojiClick
  } = useMessageInput({ onSendMessage });

  const {
    selectedFile,
    previewUrl,
    isUploading,
    handleFileSelect,
    uploadImage,
    clearFileSelection,
    checkDailyUploadLimit,
    updateDailyUploadCount
  } = useImageUpload(currentUserId);

  const handleSendMessage = async () => {
    if (!currentUserId) {
      console.error('No current user ID available');
      return;
    }
    
    try {
      console.log('Starting message send:', {
        hasContent: !!message.trim(),
        hasFile: !!selectedFile,
        timestamp: new Date().toISOString()
      });

      // Handle regular text message
      if (!selectedFile) {
        console.log('Sending text-only message');
        onSendMessage(message.trim());
        setMessage('');
        return;
      }
      
      // Check daily upload limit
      const isWithinLimit = await checkDailyUploadLimit();
      if (!isWithinLimit) {
        toast.error('Daily upload limit reached');
        return;
      }

      setUploadingMessage(true);
      console.log('Starting image upload process');

      // Upload image to storage
      const imageUrl = await uploadImage();
      
      if (!imageUrl) {
        toast.error("Failed to upload image");
        return;
      }
      
      console.log('Image uploaded successfully:', {
        imageUrl,
        timestamp: new Date().toISOString()
      });

      // Send message with image
      const messageContent = message.trim() || "[Image]";
      onSendMessage(messageContent, imageUrl);
      
      // Update daily upload count
      await updateDailyUploadCount();
      
      // Clear selection and message
      clearFileSelection();
      setMessage('');
      
    } catch (error) {
      console.error("Error in handleSend:", error);
      toast.error("An error occurred while sending your message");
    } finally {
      setUploadingMessage(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

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

      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full"
          >
            <Smile className="h-5 w-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" sideOffset={5} align="start">
          <EmojiPicker onEmojiClick={handleEmojiClick} />
        </PopoverContent>
      </Popover>

      {/* Paperclip/Image upload button */}
      <Button 
        variant="ghost" 
        size="icon" 
        className="rounded-full"
        onClick={triggerFileInput}
        disabled={isUploading || uploadingMessage}
      >
        <Paperclip className="h-5 w-5" />
      </Button>
      
      <div className="flex-1 relative">
        <Input
          ref={inputRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className="pr-16"
          maxLength={charLimit}
          disabled={isUploading || uploadingMessage}
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
        disabled={(!message.trim() && !selectedFile) || message.length > charLimit || isUploading || uploadingMessage}
      >
        <Send className="h-5 w-5" />
      </Button>
    </div>
  );
};
