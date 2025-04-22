
import { Crown } from 'lucide-react';

export const VipButton = () => {
  return (
    <button
      className="bg-chatwii-peach text-white px-4 py-1 rounded-md flex items-center space-x-1 font-medium shadow-sm hover:shadow transition-shadow"
      aria-label="VIP access"
    >
      <Crown className="h-4 w-4 mr-1" />
      <span>VIP</span>
    </button>
  );
};
