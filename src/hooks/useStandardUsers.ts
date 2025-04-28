
import { useQuery } from "@tanstack/react-query";
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { toast } from "@/hooks/use-toast";

export interface StandardUser {
  id: string;
  nickname: string;
  age?: number;
  gender?: string;
  country?: string;
  visibility: string;
  role: string;
}

export const useStandardUsers = () => {
  const { data: standardUsers, isLoading, refetch } = useQuery({
    queryKey: ["online-standard-users"],
    queryFn: async () => {
      try {
        const profilesRef = collection(db, 'profiles');
        const profilesQuery = query(
          profilesRef,
          where("role", "==", "standard"),
          where("visibility", "==", "online")
        );
        
        const querySnapshot = await getDocs(profilesQuery);
        const users: StandardUser[] = [];
        
        querySnapshot.forEach(doc => {
          users.push({ 
            id: doc.id, 
            ...doc.data() 
          } as StandardUser);
        });
        
        return users;
      } catch (error) {
        console.error('Error fetching standard users:', error);
        throw error;
      }
    },
  });

  return {
    standardUsers,
    isLoading,
    refetch
  };
};
