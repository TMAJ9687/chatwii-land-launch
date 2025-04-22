
import { Crown } from "lucide-react";

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
  avatar
}: UserListItemProps) => {
  // Get the first letter of the name for avatar
  const firstLetter = name.charAt(0).toUpperCase();
  
  const genderColor = gender === 'Female' ? 'text-pink-500' : 'text-blue-500';
  
  return (
    <div 
      className={`flex items-start p-3 gap-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
        isSelected ? 'bg-gray-100 dark:bg-gray-800' : ''
      }`}
      onClick={onClick}
    >
      {/* Avatar */}
      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
        {avatar ? (
          <img src={avatar} alt={name} className="w-full h-full rounded-full object-cover" />
        ) : (
          <span className="text-lg font-semibold">{firstLetter}</span>
        )}
      </div>
      
      {/* User info */}
      <div className="flex flex-col flex-grow min-w-0">
        <div className="flex items-center gap-1">
          <h3 className="font-semibold truncate">{name}</h3>
          {isVip && (
            <span className="flex items-center text-xs font-bold text-yellow-500">
              <Crown className="h-3 w-3 mr-0.5" />
              VIP
            </span>
          )}
        </div>
        
        <div className={`text-sm ${genderColor}`}>
          {gender}, {age}
        </div>
        
        <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
          <span className="truncate">{country}</span>
        </div>
        
        {/* Interests */}
        <div className="flex flex-wrap gap-1 mt-1">
          {interests.map((interest, idx) => (
            <span 
              key={idx} 
              className="px-2 py-0.5 text-xs bg-amber-100 dark:bg-amber-900 dark:text-amber-100 text-amber-800 rounded-sm"
            >
              {interest}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
