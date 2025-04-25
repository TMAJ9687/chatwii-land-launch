
import { z } from 'zod';

// Helper validation function for nickname
const validateNickname = (value: string, profanityList: string[] = []): string | null => {
  // VIP users get 20 chars max (regular users get 16)
  const isVip = true; // This would ideally be determined by context
  const maxLength = isVip ? 20 : 16;
  
  if (value.length > maxLength) return `Nickname must be max ${maxLength} characters`;
  
  const numberCount = (value.match(/\d/g) || []).length;
  if (numberCount > 2) return "Nickname can contain maximum 2 numbers";
  
  if (/(.)\1\1\1/.test(value)) return "Nickname cannot contain more than 3 consecutive same letters";
  
  if (!/^[a-zA-Z0-9\s]*$/.test(value)) return "Nickname can only contain letters, numbers, and spaces";
  
  const lowerCaseValue = value.toLowerCase();
  for (const word of profanityList) {
    if (lowerCaseValue.includes(word.toLowerCase())) return "Nickname contains inappropriate language";
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
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// VIP Registration Schema with enhanced nickname validation
export const vipRegisterSchema = z.object({
  nickname: z
    .string()
    .min(1, "Nickname is required")
    .max(20, "Nickname must be 20 characters or less")
    .refine(
      (value): value is string => {
        const numberCount = (value.match(/\d/g) || []).length;
        return numberCount <= 2;
      },
      {
        message: "Nickname can contain at most 2 numbers"
      }
    )
    .refine(
      (value): value is string => !/(.)\1\1\1/.test(value),
      {
        message: "Nickname cannot contain more than 3 consecutive identical letters"
      }
    )
    .refine(
      (value): value is string => /^[a-zA-Z0-9\s]*$/.test(value),
      {
        message: "Nickname can only contain letters, numbers, and spaces"
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
    .min(1, "Nickname is required"),
  gender: z.enum(["Male", "Female"]),
  age: z.number().int().min(18, "You must be at least 18 years old"),
  country: z.string().optional(),
  interests: z.array(z.string()).optional(),
});

// VIP Profile Schema
export const vipProfileSchema = z.object({
  gender: z.enum(["Male", "Female"]),
  age: z.number().int().min(18, "You must be at least 18 years old"),
  country: z.string().nullable().optional(),
  avatar_url: z.string().nullable().optional(),
});
