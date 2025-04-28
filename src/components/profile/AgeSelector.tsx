import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AgeSelectorProps {
  age: string;
  onChange: (age: string) => void;
}

export const AgeSelector: React.FC<AgeSelectorProps> = ({ age, onChange }) => {
  // Generate age options from 18 to 80 (inclusive)
  const ageOptions = Array.from({ length: 63 }, (_, i) => (i + 18).toString());

  return (
    <div className="space-y-2">
      <label
        htmlFor="age-select"
        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        Age
      </label>
      <Select value={age} onValueChange={onChange}>
        <SelectTrigger id="age-select">
          <SelectValue placeholder="Select age" />
        </SelectTrigger>
        <SelectContent>
          {ageOptions.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
