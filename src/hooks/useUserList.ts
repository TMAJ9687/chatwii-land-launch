
import { useBlockedUsers } from '@/hooks/useBlockedUsers';
import { useState, useEffect } from 'react';
import { notificationService } from '@/services/notificationService';
import { getCountryCode, getFlagEmoji } from '@/utils/countryTools';

// Enhanced hook for user list management
export const useUserList = (_onUserSelect: (userId: string) => void, _selectedUserId?: string) => {
  const { blockedUsers, unblockUser } = useBlockedUsers();
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('disconnected');
  
  // Helper function to get avatar initial from nickname
  const getAvatarInitial = (nickname: string): string => {
    return nickname ? nickname.charAt(0).toUpperCase() : '?';
  };

  // Helper function to get consistent avatar colors based on user ID
  const getAvatarColors = (userId: string): { bg: string, text: string } => {
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
  
  // Log connection status on mount to help with debugging
  useEffect(() => {
    notificationService.debug('UserList component mounted');
    
    // Set initial connection status after a short delay
    const timer = setTimeout(() => {
      setConnectionStatus('connected');
      notificationService.debug('UserList connection status set to connected');
    }, 1000);
    
    return () => {
      clearTimeout(timer);
      notificationService.debug('UserList component unmounted');
    };
  }, []);

  // Enhance a user object with derived properties needed for rendering
  const enhanceUser = (user: any) => {
    if (!user) return null;
    
    const avatarInitial = getAvatarInitial(user.nickname || '');
    const colors = getAvatarColors(user.user_id || '');
    const countryCode = getCountryCode(user.country || '');
    const flagEmoji = getFlagEmoji(countryCode);
    
    return {
      ...user,
      avatarInitial,
      avatarBgColor: colors.bg,
      avatarTextColor: colors.text,
      flagEmoji: flagEmoji || '🏳️'
    };
  };

  return {
    blockedUsers,
    unblockUser,
    connectionStatus,
    enhanceUser
  };
};
