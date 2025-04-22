
/**
 * Utility functions for message validation
 */

// Maximum character limit for standard users
export const STANDARD_CHAR_LIMIT = 120;
// Maximum character limit for VIP users
export const VIP_CHAR_LIMIT = 200;

/**
 * Check for consecutive same letters (applies to both standard and VIP)
 */
export const hasConsecutiveSameLetters = (text: string): boolean => {
  return /(.)\1\1\1/.test(text); // More than 3 consecutive same letters
};

/**
 * Check for consecutive numbers
 */
export const hasConsecutiveNumbers = (text: string): boolean => {
  return /\d{4,}/.test(text);
};

/**
 * Check for links or phone numbers (only applies to standard users)
 */
export const hasLinkOrPhone = (text: string): boolean => {
  // Check for URLs (http, https, www)
  const urlPattern = /(https?:\/\/|www\.)[^\s]+/i;
  // Check for phone number patterns (simplistic check)
  const phonePattern = /(\+\d{1,3}[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/;
  
  return urlPattern.test(text) || phonePattern.test(text);
};

/**
 * Get the appropriate character limit based on user VIP status
 */
export const getCharLimit = (isVip: boolean): number => {
  return isVip ? VIP_CHAR_LIMIT : STANDARD_CHAR_LIMIT;
};
