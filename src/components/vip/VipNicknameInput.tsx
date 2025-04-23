
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validateNickname } from "@/utils/profileValidation";

interface VipNicknameInputProps {
  value: string;
  onChange: (value: string) => void;
  profanityList?: string[];
}

export const VipNicknameInput: React.FC<VipNicknameInputProps> = ({
  value,
  onChange,
  profanityList = []
}) => {
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    const validation = validateNickname(newValue, profanityList);
    setError(validation.valid ? "" : validation.message);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="nickname">Choose your Nickname</Label>
      <Input
        id="nickname"
        value={value}
        onChange={handleChange}
        placeholder="Enter your nickname"
        className={error ? "border-red-500" : ""}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};
