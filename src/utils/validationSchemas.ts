
import { z } from 'zod';

// List of profanity words - can be expanded
const profanityList = ['fuck', 'shit', 'ass', 'bitch', 'dick', 'penis', 'vagina', 'sex'];

// Helper validation function for nickname
const validateNickname = (value: string): string | null => {
  if (value.length > 16) return "Nickname must be max 16 characters";
  
  const numberCount = (value.match(/\d/g) || []).length;
  if (numberCount > 2) return "Nickname can contain maximum 2 numbers";
  
  if (/(.)\1\1\1/.test(value)) return "Nickname cannot contain more than 3 consecutive same letters";
  
  if (!/^[a-zA-Z0-9\s]*$/.test(value)) return "Nickname can only contain letters, numbers, and spaces";
  
  const lowerCaseValue = value.toLowerCase();
  for (const word of profanityList) {
    if (lowerCaseValue.includes(word)) return "Nickname contains inappropriate language";
  }
  
  return null;
};

// Login Schema
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Registration Schema
export const registerSchema = z.object({
  nickname: z
    .string()
    .min(1, "Nickname is required")
    .refine(
      (value) => {
        const validationResult = validateNickname(value);
        return validationResult === null;
      },
      {
        message: (val) => validateNickname(val) || "Invalid nickname"
      }
    ),
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Profile Setup Schema
export const profileSchema = z.object({
  nickname: z
    .string()
    .min(1, "Nickname is required")
    .refine(
      (value) => {
        const validationResult = validateNickname(value);
        return validationResult === null;
      },
      {
        message: (val) => validateNickname(val) || "Invalid nickname"
      }
    ),
  gender: z.enum(["Male", "Female"]),
  age: z.number().int().min(18, "You must be at least 18 years old"),
  country: z.string().optional(),
  interests: z.array(z.string()).optional(),
});
