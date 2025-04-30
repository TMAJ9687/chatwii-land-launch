
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
  const [error, setError] = useState<string | null>(null);

  // Fetch blocked users on mount
  const fetchBlockedUsers = useCallback(async (currentUserId: string | null) => {
    if (!currentUserId) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const blockedRecords = await queryDocuments('blocked_users', [
        { field: 'blocker_id', operator: '==', value: currentUserId }
      ]);
      
      // Make sure blocked_id exists in each record
      const blocked = blockedRecords
        .filter(record => record.blocked_id)
        .map(record => record.blocked_id);
        
      setBlockedUsers(blocked);
      
    } catch (error) {
      console.error('Error fetching blocked users:', error);
      setError('Failed to load blocked users');
      // Only show toast on actual errors, not during normal startup
      if (currentUserId) {
        toast.error('Failed to load blocked users');
      }
      // Return empty array to avoid UI issues
      setBlockedUsers([]);
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
  
  // Unblock a user
  const unblockUser = useCallback(async (userId: string, currentUserId: string | null = null) => {
    if (!currentUserId) {
      toast.error('You need to be logged in to unblock users');
      return;
    }
    
    try {
      // Find the block record
      const blockRecords = await queryDocuments('blocked_users', [
        { field: 'blocker_id', operator: '==', value: currentUserId },
        { field: 'blocked_id', operator: '==', value: userId }
      ]);
      
      // Delete the block record if it exists
      if (blockRecords.length > 0) {
        // Import deleteDocument dynamically to avoid circular dependencies
        const { deleteDocument } = await import('@/lib/firebase');
        await deleteDocument('blocked_users', blockRecords[0].id);
      }
      
      // Update local state
      setBlockedUsers(prev => prev.filter(id => id !== userId));
      toast.success('User unblocked successfully');
      
    } catch (error) {
      console.error('Error unblocking user:', error);
      toast.error('Failed to unblock user');
    }
  }, []);
  
  // Check if user can interact with another user
  const canInteractWithUser = useCallback((userId: string) => {
    return !blockedUsers.includes(userId);
  }, [blockedUsers]);

  return {
    blockedUsers,
    isLoading,
    error,
    fetchBlockedUsers,
    blockUser,
    unblockUser,
    canInteractWithUser
  };
};
