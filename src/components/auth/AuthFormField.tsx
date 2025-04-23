
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AuthFormFieldProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  error?: string;
  autoComplete?: string;
}

export const AuthFormField: React.FC<AuthFormFieldProps> = ({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  autoComplete
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={error ? "border-red-500" : ""}
        autoComplete={autoComplete}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};
