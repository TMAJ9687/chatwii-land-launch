import React from "react";
import { countries } from "@/data/countries";

type Props = {
  value: string;
  onChange: (code: string) => void;
  label?: string;
};

export function CountrySelector({ value, onChange, label }: Props) {
  return (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium">{label}</label>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border bg-white dark:bg-gray-800 px-3 py-2"
      >
        <option value="" disabled>
          {label ?? "Select country"}
        </option>
        {countries.map((c) => (
          <option key={c.code} value={c.code}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}
