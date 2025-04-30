import React from 'react'; // Import React
import { Crown } from 'lucide-react'; // Keep lucide-react for Crown
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'; // Assuming shadcn/ui Avatar
import { Button } from '@/components/ui/button'; // Keep Button for unblock

// --- CSS for the pulsing glow (Place this in your global CSS file) ---
/*
@keyframes pulseGlow {
    0% {
        box-shadow: 0 0 4px rgba(255, 215, 0, 0.3), 0 0 6px rgba(255, 215, 0, 0.2);
    }
    50% {
        box-shadow: 0 0 8px rgba(255, 215, 0, 0.5), 0 0 12px rgba(255, 215, 0, 0.3);
    }
    100% {
        box-shadow: 0 0 4px rgba(255, 215, 0, 0.3), 0 0 6px rgba(255, 215, 0, 0.2);
    }
}

.vip-pulsing-glow {
    position: relative;
    z-index: 1;
    animation: pulseGlow 2.5s infinite ease-in-out;
}

// Optional: Style for flag emoji if needed
.flag-icon {
    display: inline-block;
    width: 1.1em;
    height: 1.1em;
    line-height: 1.1em;
    text-align: center;
    flex-shrink: 0;
}
*/
// --- End of CSS ---

interface UserListItemProps {
  name: string;
  gender: string;
  age: number;
  country: string;
  flagEmoji: string; // Added prop for flag emoji
  isVip?: boolean;
  interests: string[];
  isSelected?: boolean;
  onClick?: () => void;
  avatarUrl?: string; // Renamed from avatar for clarity
  avatarInitial: string; // Added prop for initial
  avatarBgColor: string; // Added prop for background color class (e.g., 'bg-purple-100')
  avatarTextColor: string; // Added prop for text color class (e.g., 'text-purple-600')
  isBlocked?: boolean;
  onUnblock?: () => void;
}

export const UserListItem: React.FC<UserListItemProps> = ({
  name,
  gender,
  age,
  country,
  flagEmoji,
  isVip = false,
  interests = [],
  isSelected = false,
  onClick,
  avatarUrl,
  avatarInitial,
  avatarBgColor,
  avatarTextColor,
  isBlocked = false,
  onUnblock,
}) => {
  const genderColor = gender === 'Female' ? 'text-pink-600' : 'text-blue-600';

  // Combine base classes with conditional glow class
  // Changed ml-4 mr-4 to ml-3 mr-3 to make card wider relative to placeholder
  const cardClasses = `
    flex items-center bg-white p-3 rounded-lg shadow-sm ml-3 mr-3
    ${isBlocked ? 'opacity-50 grayscale cursor-not-allowed' : 'cursor-pointer'}
    ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
    ${isVip ? 'vip-pulsing-glow' : ''}
  `;

  return (
    <div
      className={cardClasses}
      onClick={!isBlocked ? onClick : undefined}
      aria-selected={isSelected}
      role="listitem"
      tabIndex={!isBlocked ? 0 : -1}
    >
      {/* Avatar */}
      <div className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center font-semibold mr-3 ${avatarBgColor} ${avatarTextColor}`}>
        <Avatar className="w-11 h-11">
          {avatarUrl ? (
            <AvatarImage src={avatarUrl} alt={name} className="object-cover"/>
          ) : (
            <AvatarFallback className={`${avatarBgColor} ${avatarTextColor} text-lg`}>
              {avatarInitial}
            </AvatarFallback>
          )}
        </Avatar>
      </div>

      {/* User Details */}
      <div className="flex-grow min-w-0">
        {/* Top line: Name, Crown, VIP */}
        <div className="flex items-center space-x-1.5 mb-1">
          <span className="font-semibold text-sm text-gray-800 truncate">{name}</span>
          {isVip && (
            <>
              <span className="text-yellow-500 text-xs flex-shrink-0">👑</span>
              <span className="text-xs font-medium bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded flex-shrink-0">VIP</span>
            </>
          )}
        </div>

        {/* Second line: Country, Flag, Separator, Gender/Age */}
        <div className="flex items-center text-xs text-gray-500 space-x-1.5 mb-1.5">
          <span className="truncate">{country}</span>
          {flagEmoji && <span className="flag-icon">{flagEmoji}</span>}
          <span className="text-gray-300">|</span>
          <span className={`${genderColor} font-medium whitespace-nowrap`}>
            {gender}, {age}
          </span>
        </div>

        {/* Third line: Interests */}
        {interests.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {interests.map((interest, idx) => (
              <span
                key={idx}
                className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
              >
                {interest}
              </span>
            ))}
          </div>
        )}

         {/* Blocked User Unblock Button */}
         {isBlocked && onUnblock && (
           <div className="mt-2">
             <Button
               variant="ghost"
               size="sm"
               onClick={(e) => {
                 e.stopPropagation(); // Prevent card click
                 onUnblock();
               }}
               className="text-xs h-7 px-2 text-blue-600 hover:bg-blue-50"
             >
               Unblock
             </Button>
           </div>
         )}
      </div>
    </div>
  );
};