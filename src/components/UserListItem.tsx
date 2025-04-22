import { Crown } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface UserListItemProps {
  name: string;
  gender: string;
  age: number;
  country: string;
  isVip?: boolean;
  interests: string[];
  isSelected?: boolean;
  onClick?: () => void;
  avatar?: string;
  profileTheme?: string;
  isBlocked?: boolean;
  onUnblock?: () => void;
}

export const UserListItem = ({ 
  name, 
  gender, 
  age, 
  country, 
  isVip = false, 
  interests,
  isSelected = false,
  onClick,
  avatar,
  profileTheme = 'default',
  isBlocked = false,
  onUnblock
}: UserListItemProps) => {
  const firstLetter = name.charAt(0).toUpperCase();
  
  const genderColor = gender === 'Female' ? 'text-pink-500' : 'text-blue-500';
  
  let themeBorderClass = '';
  if (isVip) {
    switch (profileTheme) {
      case 'gold':
        themeBorderClass = 'border-2 border-yellow-500';
        break;
      case 'blue':
        themeBorderClass = 'border-2 border-blue-400 shadow shadow-blue-300';
        break;
      case 'purple':
        themeBorderClass = 'border-2 border-purple-500';
        break;
      case 'green':
        themeBorderClass = 'border-2 border-green-500';
        break;
      default:
        themeBorderClass = 'border-2 border-gray-300';
    }
  }
  
  return (
    <div 
      className={`flex items-start p-3 gap-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
        isSelected ? 'bg-gray-100 dark:bg-gray-800' : ''
      } ${isBlocked ? 'opacity-50 grayscale' : ''}`}
      onClick={onClick}
    >
      <div className={`flex-shrink-0 ${isVip ? themeBorderClass : ''} rounded-full`}>
        <Avatar className="w-10 h-10">
          {avatar ? (
            <AvatarImage src={avatar} alt={name} />
          ) : (
            <AvatarFallback className="bg-gray-200 dark:bg-gray-700">
              {firstLetter}
            </AvatarFallback>
          )}
        </Avatar>
      </div>
      
      <div className="flex flex-col flex-grow min-w-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <h3 className="font-semibold truncate">{name}</h3>
            {isVip && (
              <span className="flex items-center text-xs font-bold text-yellow-500">
                <Crown className="h-3 w-3 mr-0.5" />
                VIP
              </span>
            )}
          </div>
          {isBlocked && onUnblock && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onUnblock();
              }}
              className="ml-2"
            >
              Unblock
            </Button>
          )}
        </div>
        
        <div className={`text-sm ${genderColor}`}>
          {gender}, {age}
        </div>
        
        <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
          <span className="truncate">{country}</span>
        </div>
        
        <div className="flex flex-wrap gap-1 mt-1">
          {interests.map((interest, idx) => (
            <span 
              key={idx} 
              className={`px-2 py-0.5 text-xs ${isVip ? 'bg-amber-100 dark:bg-amber-900 dark:text-amber-100 text-amber-800' : 'bg-gray-100 dark:bg-gray-700 dark:text-gray-300 text-gray-600'} rounded-sm`}
            >
              {interest}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
