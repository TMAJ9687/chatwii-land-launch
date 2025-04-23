
import { useState } from 'react';

interface ChatButtonProps {
  nickname: string;
  onCaptchaClick: () => void;
  disabled?: boolean;
}

export const ChatButton = ({ nickname, onCaptchaClick, disabled }: ChatButtonProps) => {
  // Dark Orange: #F97316 (Tailwind: bg-orange-500)
  return (
    <button
      onClick={onCaptchaClick}
      disabled={disabled}
      className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-md font-medium transition-colors text-base shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
    >
      Start Chat
    </button>
  );
};

