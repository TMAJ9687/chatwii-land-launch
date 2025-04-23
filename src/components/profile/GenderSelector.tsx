
import React from "react";
import { Button } from "@/components/ui/button";

interface GenderSelectorProps {
  gender: string;
  onChange: (gender: string) => void;
}

export const GenderSelector: React.FC<GenderSelectorProps> = ({ gender, onChange }) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Gender
      </label>
      <div className="flex gap-4">
        <Button
          variant={gender === 'Male' ? 'default' : 'outline'}
          onClick={() => onChange('Male')}
          className={`flex-1 ${
            gender === 'Male'
              ? 'bg-[#33C3F0] text-white border-none hover:bg-[#33C3F0]/90'
              : ''
          }`}
        >
          Male
        </Button>
        <Button
          variant={gender === 'Female' ? 'default' : 'outline'}
          onClick={() => onChange('Female')}
          className={`flex-1 ${
            gender === 'Female'
              ? 'bg-[#D946EF] text-white border-none hover:bg-[#D946EF]/90'
              : ''
          }`}
        >
          Female
        </Button>
      </div>
    </div>
  );
};
