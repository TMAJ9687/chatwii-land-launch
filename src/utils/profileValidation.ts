
/**
 * Utility functions for validating profile information
 */

/**
 * Validates a nickname based on specific criteria
 * @param nickname - The nickname to validate
 * @param profanityList - List of banned words to check against
 */
export const validateNickname = (nickname: string, profanityList: string[] = []) => {
  // Max 16 characters
  if (nickname.length > 16) {
    return { valid: false, message: "Nickname must be 16 characters or less" };
  }

  // Max 2 numbers
  const numberCount = (nickname.match(/\d/g) || []).length;
  if (numberCount > 2) {
    return { valid: false, message: "Nickname can contain at most 2 numbers" };
  }

  // Max 3 consecutive same letters
  if (/(.)\1{3,}/.test(nickname)) {
    return { valid: false, message: "Nickname cannot contain more than 3 consecutive same letters" };
  }

  // Check against profanity list
  for (const word of profanityList) {
    if (nickname.toLowerCase().includes(word)) {
      return { valid: false, message: "Nickname contains inappropriate language" };
    }
  }

  return { valid: true, message: "" };
};

/**
 * Validates complete profile data
 */
export const validateProfileData = (gender: string, age: string) => {
  if (!gender) {
    return { valid: false, message: "Please select your gender" };
  }
  
  if (!age) {
    return { valid: false, message: "Please select your age" };
  }
  
  return { valid: true, message: "" };
};
