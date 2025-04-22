
import { useState } from 'react';

interface ChatButtonProps {
  nickname: string;
  onCaptchaClick: () => void;
  disabled?: boolean;
}

export const ChatButton = ({ nickname, onCaptchaClick, disabled }: ChatButtonProps) => {
  return (
    <button
      onClick={onCaptchaClick}
      disabled={disabled}
      className="w-full bg-chatwii-peach hover:bg-opacity-90 text-white py-3 rounded-md font-medium transition-colors text-base shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
    >
      Start Chat
    </button>
  );
};
