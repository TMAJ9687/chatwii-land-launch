
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
                
                // Ensure user has all required display properties
                const enhancedUser = enhanceUserWithDisplayProps({
                  ...userData,
                  user_id: userId,
                  is_current_user: userId === currentUserId
                });
                
                if (enhancedUser) {
                  onlineUsers.push(enhancedUser as OnlineUser);
                }
              }
            });
          }
          
          // Add mock VIP user if needed and no users are present
          if (includeMockUsers && onlineUsers.length === 0) {
            const mockUser = enhanceUserWithDisplayProps({
              ...MOCK_VIP_USER,
              is_current_user: false
            });
            
            if (mockUser) {
              onlineUsers.push(mockUser as OnlineUser);
            }
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
            const mockUser = enhanceUserWithDisplayProps({
              ...MOCK_VIP_USER,
              is_current_user: false
            });
            
            if (mockUser) {
              setUsers([mockUser as OnlineUser]);
            }
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
        const mockUser = enhanceUserWithDisplayProps({
          ...MOCK_VIP_USER,
          is_current_user: false
        });
        
        if (mockUser) {
          setUsers([mockUser as OnlineUser]);
        }
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
