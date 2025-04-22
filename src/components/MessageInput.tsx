
import { Send, Smile, Paperclip } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import EmojiPicker from 'emoji-picker-react';
import { useMessageInput } from '@/hooks/useMessageInput';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface MessageInputProps {
  onSendMessage: (content: string, imageUrl?: string) => void;
  currentUserId: string | null;
}

export const MessageInput = ({ onSendMessage, currentUserId }: MessageInputProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    message,
    setMessage,
    charLimit,
    inputRef,
    handleSend: handleTextSend,
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

  const handleSend = async () => {
    // Handle regular text message
    if (!selectedFile) {
      handleTextSend();
      return;
    }
    
    // Handle image upload
    if (!currentUserId) return;

    try {
      // Check daily upload limit
      const isWithinLimit = await checkDailyUploadLimit();
      if (!isWithinLimit) {
        toast.error('Daily upload limit reached');
        return;
      }

      // First create a message record
      const messageContent = "[Image]"; // Or use message if you want to allow caption
      
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .insert({
          content: messageContent,
          sender_id: currentUserId,
          receiver_id: window.selectedUserId || "", // This is a bit of a hack, better to pass this as a prop
          is_read: false
        })
        .select()
        .single();
      
      if (messageError) {
        console.error("Error creating message:", messageError);
        toast.error("Failed to send message");
        return;
      }
      
      // Upload image to storage
      const imageUrl = await uploadImage();
      
      if (!imageUrl || !messageData) {
        toast.error("Failed to upload image");
        return;
      }
      
      // Create media record
      const { error: mediaError } = await supabase
        .from('message_media')
        .insert({
          message_id: messageData.id,
          user_id: currentUserId,
          file_url: imageUrl,
          media_type: 'image'
        });
      
      if (mediaError) {
        console.error("Error creating media record:", mediaError);
        toast.error("Failed to link image to message");
        return;
      }

      // Update daily upload count
      await updateDailyUploadCount();
      
      // Clear selection
      clearFileSelection();
      
      // Notify parent component
      onSendMessage(messageContent, imageUrl);
    } catch (error) {
      console.error("Error in handleSend:", error);
      toast.error("An error occurred while sending your message");
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
        disabled={isUploading}
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
          disabled={isUploading}
        />
        <div className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${
          message.length > charLimit ? 'text-destructive' : 'text-muted-foreground'
        }`}>
          {message.length}/{charLimit}
        </div>
      </div>
      
      <Button 
        onClick={handleSend}
        size="icon"
        className="rounded-full"
        disabled={(!message.trim() && !selectedFile) || message.length > charLimit || isUploading}
      >
        <Send className="h-5 w-5" />
      </Button>
    </div>
  );
};
