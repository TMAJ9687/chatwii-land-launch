
// Mock implementation of profile utilities

/**
 * Directly checks if a nickname is available in the database
 * This is useful for debugging nickname availability issues
 */
export const checkNicknameAvailability = async (nickname: string): Promise<boolean> => {
  try {
    // Mock implementation - always returns true
    return true;
  } catch (error) {
    console.error('Failed to check nickname availability:', error);
    return false;
  }
};
