
import React from 'react';
import { Input } from '@/components/ui/input';

interface TextInputProps {
  message: string;
  charLimit: number;
  onChange: (value: string) => void;
  onKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
}

export const TextInput: React.FC<TextInputProps> = ({
  message,
  charLimit,
  onChange,
  onKeyPress,
  disabled,
  inputRef
}) => {
  return (
    <div className="flex-1 relative">
      <Input
        ref={inputRef}
        value={message}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={onKeyPress}
        placeholder={disabled ? "You cannot message this user" : "Type a message..."}
        className="pr-16"
        maxLength={charLimit}
        disabled={disabled}
      />
      <div className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${
        message.length > charLimit ? 'text-destructive' : 'text-muted-foreground'
      }`}>
        {message.length}/{charLimit}
      </div>
    </div>
  );
};
