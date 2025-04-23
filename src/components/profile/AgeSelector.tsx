
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AgeSelectorProps {
  age: string;
  onChange: (age: string) => void;
}

export const AgeSelector: React.FC<AgeSelectorProps> = ({ age, onChange }) => {
  // Generate age options from 18 to 80
  const ageOptions = Array.from({ length: 63 }, (_, i) => i + 18);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Age
      </label>
      <Select value={age} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select age" />
        </SelectTrigger>
        <SelectContent>
          {ageOptions.map(age => (
            <SelectItem key={age} value={age.toString()}>
              {age}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
