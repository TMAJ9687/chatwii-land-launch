import { Crown, Bot } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getFlagUrl } from "@/utils/countryTools";

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
  role?: string;
  isCurrentUser?: boolean;
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
  onUnblock,
  role = 'standard',
  isCurrentUser = false
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

  const getCountryCode = (countryName: string): string => {
    const countryMapping: Record<string, string> = {
      "Australia": "au",
      "United States": "us",
      "United Kingdom": "gb",
      "Canada": "ca",
      "Germany": "de",
      "France": "fr",
      "Spain": "es",
      "Italy": "it",
      "Japan": "jp",
      "China": "cn",
      "Brazil": "br",
      "India": "in",
      "Russia": "ru",
    };
    
    return countryMapping[countryName] || "";
  };
  
  const countryCode = getCountryCode(country);

  return (
    <div
      className={`flex items-start p-4 gap-4 ${
        isSelected ? 'bg-gray-100 dark:bg-gray-800' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
      } ${isBlocked ? 'opacity-50 grayscale' : ''} cursor-pointer transition-all`}
      onClick={onClick}
    >
      <div className={`flex-shrink-0 ${isVip ? themeBorderClass : ''} rounded-full`}>
        <Avatar className="w-12 h-12">
          {avatar ? (
            <AvatarImage src={avatar} alt={name} />
          ) : (
            <AvatarFallback className="bg-gray-200 dark:bg-gray-700">
              {firstLetter}
            </AvatarFallback>
          )}
        </Avatar>
      </div>
      
      <div className="flex flex-col flex-grow min-w-0 gap-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-base">{name}</h3>
          <div className="flex items-center gap-2">
            <span className={`${genderColor} text-sm font-medium`}>
              {gender}, {age}
            </span>
            {isVip && (
              <span className="flex items-center text-xs font-bold text-yellow-500">
                <Crown className="h-3.5 w-3.5 mr-0.5" />
                VIP
              </span>
            )}
            {role === 'bot' && (
              <span className="flex items-center text-xs font-bold text-blue-500">
                <Bot className="h-3.5 w-3.5 mr-0.5" />
                BOT
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          {country && (
            <>
              <img 
                src={getFlagUrl(country.toLowerCase())} 
                alt={`${country} flag`}
                className="w-5 h-4 mr-2 rounded-sm shadow-sm"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <span>{country}</span>
            </>
          )}
        </div>

        {interests && interests.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {interests.map((interest, idx) => (
              <span 
                key={idx} 
                className={`px-2 py-0.5 text-xs rounded-full ${
                  isVip 
                    ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                {interest}
              </span>
            ))}
          </div>
        )}
        
        {isBlocked && onUnblock && (
          <div className="mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onUnblock();
              }}
              className="text-xs h-7 px-2"
            >
              Unblock
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
