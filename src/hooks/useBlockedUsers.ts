
import { useState, useEffect } from 'react';
import { createDocument, queryDocuments, deleteDocument } from '@/lib/firebase';
import { toast } from 'sonner';

export const useBlockedUsers = () => {
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [blockedByUsers, setBlockedByUsers] = useState<string[]>([]);
  const [isLoadingBlocks, setIsLoadingBlocks] = useState(true);
  const [isLoadingBlockedBy, setIsLoadingBlockedBy] = useState(true);

  // Load blocked users
  const loadBlockedUsers = async () => {
    const userId = localStorage.getItem('firebase_user_id');
    if (!userId) {
      setBlockedUsers([]);
      setIsLoadingBlocks(false);
      return;
    }

    try {
      const blockedData = await queryDocuments('blocked_users', [
        { field: 'blocker_id', operator: '==', value: userId }
      ]);

      setBlockedUsers(blockedData.map(b => b.blocked_id || ''));
    } catch (error) {
      console.error('Error loading blocked users:', error);
      toast.error("Failed to load blocked users");
    } finally {
      setIsLoadingBlocks(false);
    }
  };

  // Load users who have blocked the current user
  const loadBlockedByUsers = async () => {
    const userId = localStorage.getItem('firebase_user_id');
    if (!userId) {
      setBlockedByUsers([]);
      setIsLoadingBlockedBy(false);
      return;
    }

    try {
      const blockedByData = await queryDocuments('blocked_users', [
        { field: 'blocked_id', operator: '==', value: userId }
      ]);

      setBlockedByUsers(blockedByData.map(b => b.blocker_id || ''));
    } catch (error) {
      console.error('Error loading blocked by users:', error);
    } finally {
      setIsLoadingBlockedBy(false);
    }
  };

  // Load data when component mounts
  useEffect(() => {
    loadBlockedUsers();
    loadBlockedByUsers();
  }, []);

  // Block a user
  const blockUser = async (blockedId: string) => {
    const userId = localStorage.getItem('firebase_user_id');
    if (!userId) {
      toast.error('You must be logged in to block users');
      return;
    }

    try {
      await createDocument('blocked_users', {
        blocker_id: userId,
        blocked_id: blockedId
      });

      toast.success('User blocked successfully');
      loadBlockedUsers();
    } catch (error) {
      console.error('Error blocking user:', error);
      toast.error('Failed to block user');
    }
  };

  // Unblock a user
  const unblockUser = async (blockedId: string) => {
    const userId = localStorage.getItem('firebase_user_id');
    if (!userId) {
      toast.error('You must be logged in to unblock users');
      return;
    }

    try {
      const blockedEntries = await queryDocuments('blocked_users', [
        { field: 'blocker_id', operator: '==', value: userId },
        { field: 'blocked_id', operator: '==', value: blockedId }
      ]);

      for (const entry of blockedEntries) {
        await deleteDocument('blocked_users', entry.id);
      }

      toast.success('User unblocked successfully');
      loadBlockedUsers();
    } catch (error) {
      console.error('Error unblocking user:', error);
      toast.error('Failed to unblock user');
    }
  };

  // Check if a user is blocked by the current user
  const isUserBlocked = (userId: string) => {
    return blockedUsers.includes(userId);
  };

  // Check if a user has blocked the current user
  const isBlockedByUser = (userId: string) => {
    return blockedByUsers.includes(userId);
  };

  // Check if the current user can interact with another user
  const canInteractWithUser = (userId: string) => {
    return !isUserBlocked(userId) && !isBlockedByUser(userId);
  };

  return {
    blockedUsers,
    blockedByUsers,
    blockUser,
    unblockUser,
    isUserBlocked,
    isBlockedByUser,
    canInteractWithUser,
    isLoadingBlocks,
    isLoadingBlockedBy,
    loadBlockedUsers,
    loadBlockedByUsers
  };
};
