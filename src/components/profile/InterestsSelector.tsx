
import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

interface InterestsSelectorProps {
  selectedInterests: string[];
  onChange: (interest: string) => void;
  isOpen: boolean;
  onToggle: (isOpen: boolean) => void;
}

export const InterestsSelector: React.FC<InterestsSelectorProps> = ({
  selectedInterests,
  onChange,
  isOpen,
  onToggle
}) => {
  const interests = [
    "Music", "Sports", "Gaming", "Travel", "Movies",
    "Food", "Technology", "Art", "Books", "Fashion"
  ];

  // Auto-expand the interests selector by default
  useEffect(() => {
    if (!isOpen) {
      onToggle(true);
    }
  }, [isOpen, onToggle]);

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle} className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Interests (Optional, select up to 2)
        </label>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm">
            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          {interests.map(interest => (
            <Button
              key={interest}
              variant={selectedInterests.includes(interest) ? 'default' : 'outline'}
              onClick={() => onChange(interest)}
              disabled={!selectedInterests.includes(interest) && selectedInterests.length >= 2}
              className="w-full"
            >
              {interest}
            </Button>
          ))}
        </div>
        <p className="text-xs text-gray-500">
          {selectedInterests.length === 0 ? (
            "Selecting interests is optional but helps match you with similar users"
          ) : (
            `Selected: ${selectedInterests.length}/2`
          )}
        </p>
      </CollapsibleContent>
    </Collapsible>
  );
};
