
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getAvatarInitial } from '@/utils/userUtils';
import { Loader2, UserX } from 'lucide-react';
import { toast } from 'sonner';
import { useBlockedUsers } from '@/hooks/useBlockedUsers';

export const BlockedUsersSidebar = () => {
  const { 
    blockedUsers, 
    isLoading: fetchingUsers, 
    unblockUser,
    fetchBlockedUsers 
  } = useBlockedUsers();
  const [blockedProfiles, setBlockedProfiles] = useState<Array<{
    id: string;
    nickname: string;
    avatar_url: string | null;
    blockedDocId: string;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load blocked user profiles when blocked users list changes
  useEffect(() => {
    const loadBlockedProfiles = async () => {
      setIsLoading(true);
      const currentUserId = auth.currentUser?.uid;
      
      if (!currentUserId || blockedUsers.length === 0) {
        setBlockedProfiles([]);
        setIsLoading(false);
        return;
      }
      
      try {
        // First get the blocked_users documents to get the document IDs
        const blockedDocs = await getDocs(
          query(
            collection(db, 'blocked_users'),
            where('blocker_id', '==', currentUserId),
            where('blocked_id', 'in', blockedUsers)
          )
        );
        
        const blockedDocMap = new Map();
        blockedDocs.forEach(doc => {
          const data = doc.data();
          blockedDocMap.set(data.blocked_id, doc.id);
        });
        
        // Now fetch the profiles for the blocked users
        const profilesQuery = query(
          collection(db, 'profiles'),
          where('id', 'in', blockedUsers)
        );
        
        const profilesSnapshot = await getDocs(profilesQuery);
        const profiles = profilesSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: data.id,
            nickname: data.nickname || 'Unknown User',
            avatar_url: data.avatar_url || null,
            blockedDocId: blockedDocMap.get(data.id) || ''
          };
        });
        
        setBlockedProfiles(profiles);
      } catch (error) {
        console.error('Error loading blocked profiles:', error);
        toast.error('Failed to load blocked user details');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadBlockedProfiles();
  }, [blockedUsers]);

  // Handle unblocking a user
  const handleUnblock = async (userId: string, blockedDocId: string) => {
    const currentUserId = auth.currentUser?.uid;
    if (!currentUserId) return;
    
    try {
      await unblockUser(userId, currentUserId);
      toast.success('User unblocked successfully');
    } catch (error) {
      console.error('Error unblocking user:', error);
      toast.error('Failed to unblock user');
    }
  };

  return (
    <div className="space-y-4">
      {(isLoading || fetchingUsers) && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}
      
      {!isLoading && !fetchingUsers && blockedProfiles.length === 0 && (
        <div className="text-center text-muted-foreground py-8">
          <UserX className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p>No blocked users</p>
        </div>
      )}
      
      {blockedProfiles.map((profile) => (
        <div key={profile.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              {profile.avatar_url ? (
                <AvatarImage src={profile.avatar_url} alt={profile.nickname} />
              ) : (
                <AvatarFallback>{getAvatarInitial(profile.nickname)}</AvatarFallback>
              )}
            </Avatar>
            <span className="font-medium">{profile.nickname}</span>
          </div>
          
          <Button 
            variant="destructive" 
            size="sm"
            onClick={() => handleUnblock(profile.id, profile.blockedDocId)}
          >
            Unblock
          </Button>
        </div>
      ))}
    </div>
  );
};
