import { useEffect, useState, useMemo } from "react";
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
  interests = [],
  isSelected = false,
  onClick,
  avatar,
  profileTheme = "default",
  isBlocked = false,
  onUnblock,
  role = "standard",
  isCurrentUser = false,
}: UserListItemProps) => {
  const firstLetter = name?.charAt(0)?.toUpperCase() || "?";
  const genderColor = useMemo(
    () => (gender === "Female" ? "text-pink-500" : "text-blue-500"),
    [gender]
  );
  const [flagUrl, setFlagUrl] = useState<string>("");
  const [showFlag, setShowFlag] = useState<boolean>(false);

  useEffect(() => {
    if (!country) {
      setShowFlag(false);
      setFlagUrl("");
      return;
    }
    try {
      const url = getFlagUrl(country);
      if (url) {
        setFlagUrl(url);
        setShowFlag(true);
      } else {
        setShowFlag(false);
      }
    } catch (error) {
      setShowFlag(false);
    }
  }, [country]);

  // Theme border for VIP users
  const themeBorderClass = useMemo(() => {
    if (!isVip) return "";
    switch (profileTheme) {
      case "gold":
        return "border-2 border-yellow-500";
      case "blue":
        return "border-2 border-blue-400 shadow shadow-blue-300";
      case "purple":
        return "border-2 border-purple-500";
      case "green":
        return "border-2 border-green-500";
      default:
        return "border-2 border-gray-300";
    }
  }, [isVip, profileTheme]);

  return (
    <div
      className={`flex items-start p-4 gap-4
        ${isSelected ? "bg-gray-100 dark:bg-gray-800" : "hover:bg-gray-50 dark:hover:bg-gray-800"}
        ${isBlocked ? "opacity-50 grayscale" : ""}
        cursor-pointer transition-all`}
      onClick={onClick}
      aria-selected={isSelected}
      tabIndex={0}
      role="listitem"
    >
      <div className={`flex-shrink-0 ${isVip ? themeBorderClass : ""} rounded-full`}>
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
          <h3 className="font-semibold text-base truncate">{name}</h3>
          <div className="flex items-center gap-2 ml-auto">
            <span className={`${genderColor} text-sm font-medium`}>
              {gender}, {age}
            </span>
            {isVip && (
              <span className="flex items-center text-xs font-bold text-yellow-500">
                <Crown className="h-3.5 w-3.5 mr-0.5" />
                VIP
              </span>
            )}
            {role === "bot" && (
              <span className="flex items-center text-xs font-bold text-blue-500">
                <Bot className="h-3.5 w-3.5 mr-0.5" />
                BOT
              </span>
            )}
          </div>
        </div>

        {/* Country & Flag */}
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          {country && (
            <div className="flex items-center">
              {showFlag && flagUrl && (
                <img
                  src={flagUrl}
                  alt={`${country} flag`}
                  className="w-5 h-4 mr-2 rounded-sm shadow-sm object-cover"
                  onError={() => setShowFlag(false)}
                  loading="lazy"
                  draggable={false}
                />
              )}
              <span>{country}</span>
            </div>
          )}
        </div>

        {/* Interests */}
        {interests.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {interests.map((interest, idx) => (
              <span
                key={idx}
                className={`px-2 py-0.5 text-xs rounded-full
                  ${
                    isVip
                      ? "bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                  }`}
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
              onClick={e => {
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
