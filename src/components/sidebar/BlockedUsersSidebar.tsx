
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export const BlockedUsersSidebar = () => {
  const queryClient = useQueryClient();

  const { data: blockedUsers } = useQuery({
    queryKey: ['blocked-users'],
    queryFn: async () => {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      const blockedUsersRef = collection(db, 'blocked_users');
      const blockedQuery = query(
        blockedUsersRef,
        where('blocker_id', '==', user.uid)
      );
      
      const querySnapshot = await getDocs(blockedQuery);
      const blockedData = [];
      
      for (const blockedDoc of querySnapshot.docs) {
        const data = blockedDoc.data();
        
        // Get profile for blocked user
        const profilesRef = collection(db, 'profiles');
        const profileQuery = query(
          profilesRef,
          where('id', '==', data.blocked_id)
        );
        
        const profileSnapshot = await getDocs(profileQuery);
        let nickname = 'Unknown';
        
        if (!profileSnapshot.empty) {
          nickname = profileSnapshot.docs[0].data().nickname || 'Unknown';
        }
        
        blockedData.push({
          blockedDoc: blockedDoc.id,
          blocked_id: data.blocked_id,
          profiles: {
            nickname
          }
        });
      }
      
      return blockedData;
    }
  });

  const unblockMutation = useMutation({
    mutationFn: async (params: { docId: string, blockedId: string }) => {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      // Delete the blocked_users document
      await deleteDoc(doc(db, 'blocked_users', params.docId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-users'] });
      toast.success('User unblocked successfully');
    },
    onError: (error) => {
      toast.error('Failed to unblock user');
      console.error('Unblock error:', error);
    }
  });

  return (
    <div className="space-y-4">
      {blockedUsers?.map((blocked) => (
        <div key={blocked.blocked_id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
          <span>{blocked.profiles?.nickname}</span>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={() => unblockMutation.mutate({ docId: blocked.blockedDoc, blockedId: blocked.blocked_id })}
          >
            Unblock
          </Button>
        </div>
      ))}
    </div>
  );
};
