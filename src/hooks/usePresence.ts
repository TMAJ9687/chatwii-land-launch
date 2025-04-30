import { useState, useEffect, useRef } from 'react';
import { realtimeDb } from '@/integrations/firebase/client';
import { ref, onValue, set, serverTimestamp, onDisconnect, DatabaseReference } from 'firebase/database';
import { toast } from 'sonner';
import { MOCK_VIP_USER } from '@/utils/mockUsers';
import { getUserProfile } from '@/lib/firebase';
import { getFlagEmoji, getCountryCode } from '@/utils/countryTools';
import { debugConversationAccess } from '@/utils/channelUtils';

interface PresenceUser {
  user_id: string;
  nickname: string;
  role: string;
  avatar_url: string | null;
  country: string | null;
  gender: string | null;
  age: number | null;
  vip_status: boolean;
  profile_theme?: string;
  interests?: string[];
  is_current_user: boolean;
  // Required fields for UserListItem component
  avatarInitial: string;
  avatarBgColor: string;
  avatarTextColor: string;
  flagEmoji: string;
}

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

export const usePresence = (currentUserId: string | null) => {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const userPresenceRef = useRef<DatabaseReference | null>(null);
  const presenceListenerRef = useRef<(() => void) | null>(null);

  // --- Handle presence setup/cleanup ---
  useEffect(() => {
    if (!currentUserId) {
      console.log('No current user ID, skipping presence setup');
      return;
    }

    let unsubPresenceListener: (() => void) | undefined;

    // Setup user presence in database and presence listener
    const setupPresence = async () => {
      try {
        console.log('Setting up presence for user:', currentUserId);
        
        // Fetch user profile
        const userProfile = await getUserProfile(currentUserId);
        console.log('User profile for presence:', userProfile);

        if (!userProfile) {
          console.warn('No user profile found for current user');
          toast.error("Could not load your profile. Please try logging in again.");
          return;
        }

        // Reference for user's own presence
        const myPresenceRef = ref(realtimeDb, `presence/${currentUserId}`);
        console.log('Presence ref:', `presence/${currentUserId}`);

        // Remove presence on disconnect
        onDisconnect(myPresenceRef).remove();

        // Get avatar colors and initial
        const avatarColors = getAvatarColors(currentUserId);
        const avatarInitial = getAvatarInitial(userProfile?.nickname || 'Anonymous');
        
        // Get country code and flag emoji
        const countryCode = getCountryCode(userProfile?.country || '');
        const flagEmoji = getFlagEmoji(countryCode);

        // Set initial presence data
        const presenceData = {
          user_id: currentUserId,
          nickname: userProfile?.nickname || 'Anonymous',
          role: userProfile?.role || 'standard',
          avatar_url: userProfile?.avatar_url || null,
          country: userProfile?.country || null,
          gender: userProfile?.gender || null,
          age: userProfile?.age || null,
          vip_status: userProfile?.vip_status || false,
          last_seen: serverTimestamp(),
          is_current_user: true,
          // Required fields for UserListItem
          avatarInitial: avatarInitial,
          avatarBgColor: avatarColors.bg,
          avatarTextColor: avatarColors.text,
          flagEmoji: flagEmoji || '🏳️' // Fallback to neutral flag
        };

        console.log('Setting presence data:', presenceData);
        await set(myPresenceRef, presenceData);

        userPresenceRef.current = myPresenceRef;

        // Listen for global presence updates
        const presenceRef = ref(realtimeDb, 'presence');
        console.log('Listening to all presence at:', 'presence');
        
        // Test database rules for reading presence
        console.log('Testing database access to presence:', 
          debugConversationAccess('presence', currentUserId));
        
        // Add error handling to onValue listener
        unsubPresenceListener = onValue(
          presenceRef, 
          (snapshot) => {
            console.log('Presence data received, exists:', snapshot.exists());
            setConnectionError(null); // Clear any previous errors
            
            const users: PresenceUser[] = [];
            
            if (!snapshot.exists()) {
              console.log('No users present, adding mock user');
              // Add required fields to mock VIP user
              const mockUserWithRequiredFields = {
                ...MOCK_VIP_USER,
                avatarInitial: getAvatarInitial(MOCK_VIP_USER.nickname),
                avatarBgColor: 'bg-yellow-100',
                avatarTextColor: 'text-yellow-600',
                flagEmoji: '🇺🇸'
              };
              setOnlineUsers([mockUserWithRequiredFields]);
              return;
            }
            
            snapshot.forEach((childSnapshot) => {
              const userData = childSnapshot.val();
              const userId = childSnapshot.key;
              
              if (userData && userId) {
                console.log(`User present: ${userId} (${userData.nickname})`);
                
                // If user data doesn't have required fields, add them
                if (!userData.avatarInitial || !userData.avatarBgColor) {
                  const avatarColors = getAvatarColors(userId);
                  const avatarInitial = getAvatarInitial(userData.nickname || 'Anonymous');
                  const countryCode = getCountryCode(userData.country || '');
                  const flagEmoji = getFlagEmoji(countryCode);
                  
                  users.push({
                    ...userData,
                    user_id: userId,
                    is_current_user: userId === currentUserId,
                    avatarInitial: avatarInitial,
                    avatarBgColor: avatarColors.bg,
                    avatarTextColor: avatarColors.text,
                    flagEmoji: flagEmoji || '🏳️' // Fallback to neutral flag
                  });
                } else {
                  users.push({
                    ...userData,
                    user_id: userId,
                    is_current_user: userId === currentUserId
                  });
                }
              }
            });
            
            // Always include mock VIP user with required fields
            const mockUser = users.find(u => u.user_id === MOCK_VIP_USER.user_id);
            if (!mockUser) {
              console.log('Adding mock VIP user to presence list');
              // Add required fields to mock VIP user
              const mockUserWithRequiredFields = {
                ...MOCK_VIP_USER,
                avatarInitial: getAvatarInitial(MOCK_VIP_USER.nickname),
                avatarBgColor: 'bg-yellow-100',
                avatarTextColor: 'text-yellow-600',
                flagEmoji: '🇺🇸'
              };
              users.push(mockUserWithRequiredFields);
            }
            
            console.log(`Total online users: ${users.length}`);
            console.log('Online users data:', users);
            setOnlineUsers(users);
          },
          (error) => {
            // New error handling
            console.error('Error listening to presence:', error);
            setConnectionError(`Failed to connect to presence system: ${error.message}`);
            
            // Add fallback mock user so UI is not empty
            const mockUserWithRequiredFields = {
              ...MOCK_VIP_USER,
              avatarInitial: getAvatarInitial(MOCK_VIP_USER.nickname),
              avatarBgColor: 'bg-yellow-100',
              avatarTextColor: 'text-yellow-600',
              flagEmoji: '🇺🇸'
            };
            setOnlineUsers([mockUserWithRequiredFields]);
            
            // Show error toast
            toast.error('Failed to connect to user presence system. Please check your connection.');
          }
        );
        
        presenceListenerRef.current = unsubPresenceListener;

      } catch (error) {
        console.error('Error in presence system:', error);
        setConnectionError(`Error in presence system: ${error instanceof Error ? error.message : String(error)}`);
        toast.error('Failed to connect to presence system');
      }
    };

    setupPresence();

    // Cleanup on unmount
    return () => {
      console.log('Cleaning up presence for user:', currentUserId);
      
      // Remove user presence
      if (userPresenceRef.current) {
        set(userPresenceRef.current, null)
          .catch(err => console.error('Error clearing presence:', err));
        userPresenceRef.current = null;
      }
      
      // Unsubscribe from presence listener
      if (typeof presenceListenerRef.current === 'function') {
        presenceListenerRef.current();
        presenceListenerRef.current = null;
      }
      
      if (typeof unsubPresenceListener === 'function') {
        unsubPresenceListener();
      }
    };
  }, [currentUserId]);

  return { onlineUsers, connectionError };
};
