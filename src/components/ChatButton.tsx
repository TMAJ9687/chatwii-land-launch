
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface ChatButtonProps {
  nickname: string;
  onCaptchaClick: () => void;
  disabled?: boolean;
  error?: string;
  variant?: 'primary' | 'secondary';
}

export const ChatButton = ({ 
  nickname, 
  onCaptchaClick, 
  disabled, 
  error,
  variant = 'primary'
}: ChatButtonProps) => {
  const [isPressed, setIsPressed] = useState(false);
  
  const handleClick = () => {
    setIsPressed(true);
    onCaptchaClick();
    
    // Reset the pressed state after a delay
    setTimeout(() => setIsPressed(false), 300);
  };
  
  return (
    <div>
      <button
        onClick={handleClick}
        disabled={disabled || isPressed}
        className={`w-full py-3 rounded-md font-medium transition-colors text-base shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center
          ${variant === 'primary' 
            ? 'bg-orange-500 hover:bg-orange-600 text-white' 
            : 'bg-teal-500 hover:bg-teal-600 text-white'}`}
        aria-label="Start Chat"
      >
        {disabled ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            <span>Processing...</span>
          </>
        ) : (
          <span>Start Chat</span>
        )}
      </button>
      
      {error && (
        <p className="text-sm text-red-500 mt-2 text-center">{error}</p>
      )}
    </div>
  );
};
