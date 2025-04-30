
import { useState, useEffect, useRef } from 'react';
import { realtimeDb } from '@/integrations/firebase/client';
import { ref, onValue } from 'firebase/database';
import { toast } from 'sonner';
import { MOCK_VIP_USER } from '@/utils/mockUsers';
import { enhanceUserWithDisplayProps } from '@/utils/userUtils';

export interface OnlineUser {
  user_id: string;
  nickname: string;
  gender: string;
  age: number;
  country: string;
  role?: string;
  vip_status?: boolean;
  avatar_url?: string;
  is_current_user?: boolean;
  avatarInitial: string;
  avatarBgColor: string;
  avatarTextColor: string;
  flagEmoji: string;
}

interface UseOnlineUsersOptions {
  includeMockUsers?: boolean;
  currentUserId?: string | null;
  showSelf?: boolean;
}

/**
 * Hook to watch for online users in the presence system
 */
export const useOnlineUsers = (options: UseOnlineUsersOptions = {}) => {
  const { includeMockUsers = true, currentUserId = null, showSelf = false } = options;
  const [users, setUsers] = useState<OnlineUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    setIsLoading(true);
    
    try {
      console.log('Setting up online users listener');
      const presenceRef = ref(realtimeDb, 'presence');
      
      const unsubscribe = onValue(
        presenceRef,
        (snapshot) => {
          setIsLoading(false);
          setError(null);
          
          const onlineUsers: OnlineUser[] = [];
          if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
              const userData = childSnapshot.val();
              const userId = childSnapshot.key;
              
              if (userData && userId) {
                // Skip current user if showSelf is false
                if (!showSelf && userId === currentUserId) {
                  return;
                }
                
                // Enhance user with display properties directly here
                const avatarInitial = userData.nickname ? userData.nickname.charAt(0).toUpperCase() : '?';
                
                // Create a simple hash from the user ID for consistent colors
                const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                
                // Define color sets
                const colorSets = [
                  { bg: 'bg-purple-100', text: 'text-purple-600' },
                  { bg: 'bg-blue-100', text: 'text-blue-600' },
                  { bg: 'bg-green-100', text: 'text-green-600' },
                  { bg: 'bg-yellow-100', text: 'text-yellow-600' },
                  { bg: 'bg-red-100', text: 'text-red-600' },
                  { bg: 'bg-pink-100', text: 'text-pink-600' },
                  { bg: 'bg-indigo-100', text: 'text-indigo-600' },
                ];
                
                // Use hash to select a color set
                const colorIndex = hash % colorSets.length;
                const colors = colorSets[colorIndex];
                
                // Get flag emoji (simple version)
                let flagEmoji = '🏳️';
                if (userData.country) {
                  try {
                    // Simple country code detection - first try direct country code
                    let countryCode = userData.country;
                    if (countryCode.length > 2) {
                      // If it's a full country name, use first two letters as a fallback
                      countryCode = userData.country.substring(0, 2).toUpperCase();
                    }
                    
                    // Convert to regional indicator symbols
                    const codePoints = [...countryCode.substring(0, 2).toUpperCase()]
                      .map(char => 127397 + char.charCodeAt(0));
                    flagEmoji = String.fromCodePoint(...codePoints);
                  } catch (e) {
                    console.warn('Error generating flag emoji');
                    flagEmoji = '🏳️';
                  }
                }
                
                const enhancedUser = {
                  ...userData,
                  user_id: userId,
                  is_current_user: userId === currentUserId,
                  avatarInitial,
                  avatarBgColor: colors.bg,
                  avatarTextColor: colors.text,
                  flagEmoji
                };
                
                onlineUsers.push(enhancedUser as OnlineUser);
              }
            });
          }
          
          // Add mock VIP user if needed and no users are present
          if (includeMockUsers && onlineUsers.length === 0) {
            const mockUser = {
              ...MOCK_VIP_USER,
              is_current_user: false,
              avatarInitial: 'V',
              avatarBgColor: 'bg-yellow-100',
              avatarTextColor: 'text-yellow-600',
              flagEmoji: '🇺🇸'
            };
            
            onlineUsers.push(mockUser as OnlineUser);
          }
          
          console.log(`Online users found: ${onlineUsers.length}`);
          setUsers(onlineUsers);
        },
        (err) => {
          console.error('Error listening to online users:', err);
          setError('Failed to fetch online users');
          setIsLoading(false);
          
          // Add fallback mock user when there's an error
          if (includeMockUsers) {
            const mockUser = {
              ...MOCK_VIP_USER,
              is_current_user: false,
              avatarInitial: 'V',
              avatarBgColor: 'bg-yellow-100',
              avatarTextColor: 'text-yellow-600',
              flagEmoji: '🇺🇸'
            };
            
            setUsers([mockUser as OnlineUser]);
          }
          
          toast.error('Could not connect to chat server');
        }
      );
      
      unsubscribeRef.current = unsubscribe;
    } catch (err) {
      console.error('Error setting up online users hook:', err);
      setError('Failed to initialize online users');
      setIsLoading(false);
      
      // Add fallback mock user
      if (includeMockUsers) {
        const mockUser = {
          ...MOCK_VIP_USER,
          is_current_user: false,
          avatarInitial: 'V',
          avatarBgColor: 'bg-yellow-100',
          avatarTextColor: 'text-yellow-600',
          flagEmoji: '🇺🇸'
        };
        
        setUsers([mockUser as OnlineUser]);
      }
    }
    
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [includeMockUsers, currentUserId, showSelf]);

  return {
    onlineUsers: users,
    isLoading,
    error,
    hasUsers: users.length > 0
  };
};
