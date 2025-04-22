
export type Gender = 'Male' | 'Female';
export type FilterState = {
  selectedGenders: Gender[];
  ageRange: {
    min: number;
    max: number;
  };
  selectedCountries: string[];
};

export const DEFAULT_FILTERS: FilterState = {
  selectedGenders: [],
  ageRange: {
    min: 18,
    max: 80,
  },
  selectedCountries: [],
};
