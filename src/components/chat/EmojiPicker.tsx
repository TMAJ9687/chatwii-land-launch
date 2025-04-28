import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { useTheme } from 'next-themes';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
}

export const EmojiPicker = ({ onEmojiSelect, onClose }: EmojiPickerProps) => {
  const { theme } = useTheme();

  // Handler to ensure only valid emoji are returned
  const handleEmojiSelect = (emoji: any) => {
    if (emoji && typeof emoji.native === 'string') {
      onEmojiSelect(emoji.native);
    }
  };

  return (
    <div className="absolute right-0 top-full z-50">
      {/* Overlay to close on click outside */}
      <div
        className="fixed inset-0"
        aria-label="Close emoji picker"
        tabIndex={-1}
        onClick={onClose}
      />
      <Picker
        data={data}
        onEmojiSelect={handleEmojiSelect}
        theme={theme === 'dark' ? 'dark' : 'light'}
        previewPosition="none"
        skinTonePosition="none"
      />
    </div>
  );
};
