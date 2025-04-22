
import { RefreshCcw } from 'lucide-react';
import { generateRandomUsername } from '@/lib/username-generator';

interface UsernameInputProps {
  maxLength?: number;
  value: string;
  onChange: (value: string) => void;
}

export const UsernameInput = ({ maxLength = 16, value, onChange }: UsernameInputProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= maxLength) {
      onChange(newValue);
    }
  };

  const handleRandomUsername = () => {
    onChange(generateRandomUsername());
  };

  return (
    <div className="relative w-full">
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder="Enter Nickname"
        className="w-full px-3 py-2 border border-gray-200 rounded-md dark:bg-gray-800 dark:border-gray-700 pr-16 focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600"
        aria-label="Enter your nickname"
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
  );
};
