
import React from 'react';
import { Input } from '@/components/ui/input';

interface TextInputProps {
  value: string; // Changed from message
  onChange: (value: string) => void;
  onKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  ref?: React.RefObject<HTMLInputElement>;
}

export const TextInput: React.FC<TextInputProps> = ({
  value, // Changed from message
  onChange,
  onKeyPress,
  placeholder = "Type a message...",
  disabled = false,
  ref
}) => {
  return (
    <div className="flex-1">
      <Input
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={onKeyPress}
        placeholder={disabled ? "You cannot message this user" : placeholder}
        disabled={disabled}
      />
    </div>
  );
};
