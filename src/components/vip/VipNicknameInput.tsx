
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProfanityList } from "@/hooks/useProfanityList";

interface VipNicknameInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidityChange?: (isValid: boolean) => void;
}

export const VipNicknameInput: React.FC<VipNicknameInputProps> = ({
  value,
  onChange,
  onValidityChange
}) => {
  const [error, setError] = useState("");
  const { profanityList, isLoading } = useProfanityList('nickname');

  // Validate nickname whenever it changes or profanity list loads
  useEffect(() => {
    validateNickname(value);
  }, [value, profanityList]);

  const validateNickname = (nickname: string) => {
    // Reset error
    setError("");
    let isValid = true;

    // Empty check
    if (!nickname.trim()) {
      setError("Nickname is required");
      isValid = false;
    }
    // Length check - max 20 characters
    else if (nickname.length > 20) {
      setError("Nickname must be 20 characters or less");
      isValid = false;
    }
    // Number count check - max 2 numbers
    else if ((nickname.match(/\d/g) || []).length > 2) {
      setError("Nickname can contain at most 2 numbers");
      isValid = false;
    }
    // Consecutive identical letters - max 3
    else if (/(.)\1\1\1/.test(nickname)) {
      setError("Nickname cannot contain more than 3 consecutive identical letters");
      isValid = false;
    }
    // Alphanumeric and spaces only
    else if (!/^[a-zA-Z0-9\s]*$/.test(nickname)) {
      setError("Nickname can only contain letters, numbers, and spaces");
      isValid = false;
    }
    // Profanity check
    else if (profanityList?.length) {
      const lowercaseNickname = nickname.toLowerCase();
      for (const word of profanityList) {
        if (lowercaseNickname.includes(word.toLowerCase())) {
          setError("Nickname contains inappropriate language");
          isValid = false;
          break;
        }
      }
    }

    // Update parent component about validity
    if (onValidityChange) {
      onValidityChange(isValid);
    }
    
    return isValid;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="nickname">Choose your Nickname</Label>
      <Input
        id="nickname"
        value={value}
        onChange={handleChange}
        placeholder={isLoading ? "Loading..." : "Enter your nickname"}
        className={error ? "border-red-500" : ""}
        maxLength={20}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      {!error && value && <p className="text-sm text-green-500">Nickname is valid</p>}
    </div>
  );
};
