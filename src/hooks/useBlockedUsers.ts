
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { createDocument, queryDocuments } from '@/lib/firebase';

interface BlockedUser {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: any;
}

export const useBlockedUsers = () => {
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch blocked users on mount
  const fetchBlockedUsers = useCallback(async (currentUserId: string | null) => {
    if (!currentUserId) return;
    setIsLoading(true);
    
    try {
      const blockedRecords = await queryDocuments('blocked_users', [
        { field: 'blocker_id', operator: '==', value: currentUserId }
      ]);
      
      const blocked = blockedRecords.map(record => record.blocked_id);
      setBlockedUsers(blocked);
      
    } catch (error) {
      console.error('Error fetching blocked users:', error);
      toast.error('Failed to load blocked users');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Block a user
  const blockUser = useCallback(async (userId: string, currentUserId: string | null) => {
    if (!currentUserId) {
      toast.error('You need to be logged in to block users');
      return;
    }
    
    if (blockedUsers.includes(userId)) {
      toast.info('User is already blocked');
      return;
    }
    
    try {
      // Check if block already exists
      const existingBlocks = await queryDocuments('blocked_users', [
        { field: 'blocker_id', operator: '==', value: currentUserId },
        { field: 'blocked_id', operator: '==', value: userId }
      ]);
      
      if (existingBlocks.length === 0) {
        // Create new block record
        await createDocument('blocked_users', {
          blocker_id: currentUserId,
          blocked_id: userId
        });
      }
      
      // Update local state
      setBlockedUsers(prev => [...prev, userId]);
      toast.success('User blocked successfully');
      
    } catch (error) {
      console.error('Error blocking user:', error);
      toast.error('Failed to block user');
    }
  }, [blockedUsers]);
  
  // Check if user can interact with another user
  const canInteractWithUser = useCallback((userId: string) => {
    return !blockedUsers.includes(userId);
  }, [blockedUsers]);

  return {
    blockedUsers,
    isLoading,
    fetchBlockedUsers,
    blockUser,
    canInteractWithUser
  };
};
