
import { RefreshCcw } from 'lucide-react';
import { generateRandomUsername } from '@/lib/username-generator';
import { validateNickname } from '@/utils/profileValidation';
import { useProfanityList } from '@/hooks/useProfanityList';

interface ValidatedUsernameInputProps {
  maxLength?: number;
  value: string;
  onChange: (value: string) => void;
  onValidityChange?: (isValid: boolean) => void;
}

export const ValidatedUsernameInput = ({ 
  maxLength = 16, 
  value, 
  onChange,
  onValidityChange 
}: ValidatedUsernameInputProps) => {
  const { profanityList, isLoading } = useProfanityList('nickname');
  const validation = validateNickname(value, profanityList);
  const hasError = value.length > 0 && !validation.valid;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= maxLength) {
      onChange(newValue);
      if (onValidityChange) {
        onValidityChange(validateNickname(newValue, profanityList).valid);
      }
    }
  };

  const handleRandomUsername = () => {
    const newUsername = generateRandomUsername();
    onChange(newUsername);
    if (onValidityChange) {
      onValidityChange(validateNickname(newUsername, profanityList).valid);
    }
  };

  return (
    <div className="w-full space-y-1">
      <div className="relative w-full">
        <input
          type="text"
          value={value}
          onChange={handleChange}
          placeholder={isLoading ? "Loading..." : "Enter Nickname"}
          className={`w-full px-3 py-2 border rounded-md dark:bg-gray-800 pr-16 focus:outline-none focus:ring-1 transition-colors
            ${hasError 
              ? 'border-red-500 focus:ring-red-500' 
              : 'border-gray-200 dark:border-gray-700 focus:ring-gray-300 dark:focus:ring-gray-600'
            }`}
          aria-label="Enter your nickname"
          disabled={isLoading}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <span className="text-xs text-gray-400">{value.length}/{maxLength}</span>
          <button 
            onClick={handleRandomUsername} 
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
            aria-label="Generate random username"
          >
            <RefreshCcw className="h-4 w-4" />
          </button>
        </div>
      </div>
      {hasError && (
        <p className="text-sm text-red-500">{validation.message}</p>
      )}
    </div>
  );
};
