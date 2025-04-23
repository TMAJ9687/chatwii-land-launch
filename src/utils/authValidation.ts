
/**
 * Utility functions for validating auth credentials
 */

export const validateNickname = (value: string, profanityList: string[] = []): string => {
  if (!value) return "Nickname is required";
  if (value.length > 16) return "Nickname must be max 16 characters";
  
  const numberCount = (value.match(/\d/g) || []).length;
  if (numberCount > 2) return "Nickname can contain maximum 2 numbers";
  
  if (/(.)\1\1\1/.test(value)) return "Nickname cannot contain more than 3 consecutive same letters";
  
  if (!/^[a-zA-Z0-9\s]*$/.test(value)) return "Nickname can only contain letters, numbers, and spaces";
  
  const lowerCaseValue = value.toLowerCase();
  for (const word of profanityList) {
    if (lowerCaseValue.includes(word)) return "Nickname contains inappropriate language";
  }
  
  return "";
};

export const validateEmail = (value: string): string => {
  if (!value) return "Email is required";
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) return "Please enter a valid email address";
  
  return "";
};

export const validatePassword = (value: string): string => {
  if (!value) return "Password is required";
  if (value.length < 8) return "Password must be at least 8 characters";
  return "";
};

export const validateConfirmPassword = (value: string, password: string): string => {
  if (!value) return "Please confirm your password";
  if (value !== password) return "Passwords don't match";
  return "";
};
