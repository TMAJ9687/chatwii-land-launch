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
  // Adjusted gender colors for dark mode
  const genderColor = gender === 'Female'
    ? 'text-pink-600 dark:text-pink-400'
    : 'text-blue-600 dark:text-blue-400';

  // Combine base classes with conditional glow class and dark mode variants
  const cardClasses = `
    flex items-center bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm ml-3 mr-3
    ${isBlocked ? 'opacity-50 grayscale cursor-not-allowed' : 'cursor-pointer'}
    ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-gray-900' : ''}
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
            // Added dark mode variant for fallback background
            <AvatarFallback className={`${avatarBgColor} ${avatarTextColor} text-lg dark:bg-opacity-80`}>
              {avatarInitial}
            </AvatarFallback>
          )}
        </Avatar>
      </div>

      {/* User Details */}
      <div className="flex-grow min-w-0"> {/* min-w-0 prevents flex item from overflowing */}
        {/* Top line: Name, Crown, VIP */}
        <div className="flex items-center space-x-1.5 mb-1">
          {/* Added dark text color */}
          <span className="font-semibold text-sm text-gray-800 dark:text-gray-100 truncate">{name}</span>
          {isVip && (
            <>
              <span className="text-yellow-500 text-xs flex-shrink-0">👑</span>
              {/* Added dark mode variants for VIP tag */}
              <span className="text-xs font-medium bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-200 px-1.5 py-0.5 rounded flex-shrink-0">VIP</span>
            </>
          )}
        </div>

        {/* Second line: Country, Flag, Separator, Gender/Age */}
        {/* Added dark text color */}
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-1.5 mb-1.5">
          <span className="truncate">{country}</span>
          {flagEmoji && <span className="flag-icon">{flagEmoji}</span>}
          {/* Added dark border color for separator */}
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <span className={`${genderColor} font-medium whitespace-nowrap`}> {/* whitespace-nowrap prevents wrapping */}
            {gender}, {age}
          </span>
        </div>

        {/* Third line: Interests */}
        {interests.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {interests.map((interest, idx) => (
              <span
                key={idx}
                // Added dark mode variants for interest tags
                className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full"
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
               // Added dark mode variants for unblock button
               className="text-xs h-7 px-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-gray-700"
             >
               Unblock
             </Button>
           </div>
         )}
      </div>
    </div>
  );
};