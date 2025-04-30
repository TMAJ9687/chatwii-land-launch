
/**
 * Helper utilities for user display and avatars
 */
import { getFlagEmoji, getCountryCode } from './countryTools';

/**
 * Get the initial letter for a user's avatar from their nickname
 */
export const getAvatarInitial = (nickname: string): string => {
  return nickname ? nickname.charAt(0).toUpperCase() : '?';
};

/**
 * Get consistent avatar colors based on user ID
 * Returns background and text color Tailwind classes
 */
export const getAvatarColors = (userId: string): { bg: string, text: string } => {
  // Create a simple hash from the user ID
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Define color sets (background and text colors that work well together)
  const colorSets = [
    { bg: 'bg-purple-100', text: 'text-purple-600' },
    { bg: 'bg-blue-100', text: 'text-blue-600' },
    { bg: 'bg-green-100', text: 'text-green-600' },
    { bg: 'bg-yellow-100', text: 'text-yellow-600' },
    { bg: 'bg-red-100', text: 'text-red-600' },
    { bg: 'bg-pink-100', text: 'text-pink-600' },
    { bg: 'bg-indigo-100', text: 'text-indigo-600' },
  ];
  
  // Use the hash to select a color set
  const colorIndex = hash % colorSets.length;
  return colorSets[colorIndex];
};

/**
 * Enhance a basic user object with display properties for the UI
 */
export const enhanceUserWithDisplayProps = (user: any) => {
  if (!user || !user.user_id) return null;
  
  // If user already has these properties, don't recalculate
  if (user.avatarInitial && user.avatarBgColor && user.flagEmoji) {
    return user;
  }
  
  const avatarInitial = getAvatarInitial(user.nickname || '');
  const colors = getAvatarColors(user.user_id);
  const countryCode = getCountryCode(user.country || '');
  const flagEmoji = getFlagEmoji(countryCode || '') || '🏳️';
  
  return {
    ...user,
    avatarInitial,
    avatarBgColor: colors.bg,
    avatarTextColor: colors.text,
    flagEmoji
  };
};

/**
 * Format a user's display name with appropriate badges/icons
 */
export const formatUserDisplayName = (user: any) => {
  if (!user) return 'Unknown User';
  
  const name = user.nickname || user.displayName || 'Anonymous';
  const isVip = user.role === 'vip' || user.vip_status;
  
  return isVip ? `${name} 👑` : name;
};
