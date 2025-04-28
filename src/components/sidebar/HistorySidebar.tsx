
import { useQuery } from '@tanstack/react-query';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { Button } from '@/components/ui/button';

interface HistorySidebarProps {
  onUserSelect: (userId: string) => void;
}

export const HistorySidebar = ({ onUserSelect }: HistorySidebarProps) => {
  const { data: conversationHistory } = useQuery({
    queryKey: ['chat-history'],
    queryFn: async () => {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      // Get messages from or to the current user
      const messagesRef = collection(db, 'messages');
      const messagesQuery = query(
        messagesRef,
        where('sender_id', '==', user.uid),
        orderBy('created_at', 'desc')
      );
      
      const receivedQuery = query(
        messagesRef,
        where('receiver_id', '==', user.uid),
        orderBy('created_at', 'desc')
      );
      
      const [sentSnapshot, receivedSnapshot] = await Promise.all([
        getDocs(messagesQuery),
        getDocs(receivedQuery)
      ]);
      
      // Collect all user IDs we need to look up
      const uniqueUserIds = new Map();
      
      sentSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.receiver_id !== user.uid) {
          uniqueUserIds.set(data.receiver_id, null);
        }
      });
      
      receivedSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.sender_id !== user.uid) {
          uniqueUserIds.set(data.sender_id, null);
        }
      });
      
      // Fetch profile data for each unique user ID
      const profiles = [];
      
      for (const userId of uniqueUserIds.keys()) {
        const profileRef = collection(db, 'profiles');
        const profileQuery = query(
          profileRef,
          where('id', '==', userId),
          limit(1)
        );
        
        const profileSnapshot = await getDocs(profileQuery);
        if (!profileSnapshot.empty) {
          const profileData = profileSnapshot.docs[0].data();
          profiles.push({
            id: userId,
            nickname: profileData.nickname,
            avatar_url: profileData.avatar_url
          });
        }
      }
      
      return profiles;
    }
  });

  return (
    <div className="space-y-4">
      {conversationHistory?.map((user) => (
        <Button
          key={user.id}
          variant="ghost"
          className="w-full justify-start"
          onClick={() => onUserSelect(user.id)}
        >
          {user.nickname}
        </Button>
      ))}
    </div>
  );
};
