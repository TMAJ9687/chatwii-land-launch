
import React, { useRef, useEffect } from 'react';
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FilterState, Gender } from '@/types/filters';
import { COUNTRIES } from '@/constants/countries';

interface FilterPopupProps {
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  onClearFilters: () => void;
  onClickOutside: () => void;
}

export const FilterPopup = ({ 
  filters, 
  onFilterChange, 
  onClearFilters,
  onClickOutside 
}: FilterPopupProps) => {
  const popupRef = useRef<HTMLDivElement>(null);

  // NEW: ref to track if a radix Select is open
  const selectPortalRoot = document?.body;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // If click target is inside a Select dropdown, do not close popup
      const popupContains = popupRef.current && popupRef.current.contains(event.target as Node);
      // Check for radix-select-content class (added by shadcn/radix select popper)
      const targetElem = event.target as HTMLElement;
      const isRadixDropdown = targetElem?.closest('.radix-select-content,.radix-select-viewport,[data-radix-popper-content-wrapper]');
      if (!popupContains && !isRadixDropdown) {
        onClickOutside();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClickOutside]);

  const handleGenderChange = (gender: Gender) => {
    const selectedGenders = filters.selectedGenders.includes(gender)
      ? filters.selectedGenders.filter(g => g !== gender)
      : [...filters.selectedGenders, gender];
    onFilterChange({ selectedGenders });
  };

  const handleAgeChange = (type: 'min' | 'max', value: string) => {
    const numValue = Math.min(Math.max(parseInt(value) || 18, 18), 80);
    onFilterChange({
      ageRange: {
        ...filters.ageRange,
        [type]: numValue
      }
    });
  };

  const handleCountryChange = (country: string) => {
    let selectedCountries = [...filters.selectedCountries];
    if (selectedCountries.includes(country)) {
      selectedCountries = selectedCountries.filter(c => c !== country);
    } else if (selectedCountries.length < 2) {
      selectedCountries.push(country);
    }
    onFilterChange({ selectedCountries });
  };

  return (
    <div 
      ref={popupRef}
      className="absolute right-0 top-12 w-64 bg-background border rounded-lg shadow-lg p-4 z-50"
    >
      {/* Gender Filter */}
      <div className="space-y-2 mb-4">
        <Label>Gender</Label>
        <div className="flex gap-4">
          {['Male', 'Female'].map((gender) => (
            <div key={gender} className="flex items-center space-x-2">
              <Checkbox
                id={`gender-${gender}`}
                checked={filters.selectedGenders.includes(gender as Gender)}
                onCheckedChange={() => handleGenderChange(gender as Gender)}
              />
              <Label htmlFor={`gender-${gender}`}>{gender}</Label>
            </div>
          ))}
        </div>
      </div>

      {/* Age Range Filter */}
      <div className="space-y-2 mb-4">
        <Label>Age Range</Label>
        <div className="flex gap-2">
          <Input
            type="number"
            min={18}
            max={80}
            value={filters.ageRange.min}
            onChange={(e) => handleAgeChange('min', e.target.value)}
            className="w-20"
          />
          <span className="flex items-center">to</span>
          <Input
            type="number"
            min={18}
            max={80}
            value={filters.ageRange.max}
            onChange={(e) => handleAgeChange('max', e.target.value)}
            className="w-20"
          />
        </div>
      </div>

      {/* Country Filter */}
      <div className="space-y-2 mb-4">
        <Label>Countries (max 2)</Label>
        <Select
          value={filters.selectedCountries[0] || ''}
          onValueChange={handleCountryChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select country" />
          </SelectTrigger>
          <SelectContent className="radix-select-content z-[99] bg-background">
            {COUNTRIES.map((country) => (
              <SelectItem key={country} value={country}>
                {country}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {filters.selectedCountries.length > 0 && (
          <Select
            value={filters.selectedCountries[1] || ''}
            onValueChange={handleCountryChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select another country" />
            </SelectTrigger>
            <SelectContent className="radix-select-content z-[99] bg-background">
              {COUNTRIES.filter(c => c !== filters.selectedCountries[0]).map((country) => (
                <SelectItem key={country} value={country}>
                  {country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Clear Filters Button */}
      <Button 
        variant="outline" 
        onClick={onClearFilters}
        className="w-full"
      >
        Clear Filters
      </Button>
    </div>
  );
};
