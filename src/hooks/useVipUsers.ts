
import { useQuery } from "@tanstack/react-query";
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export interface VipUser {
  id: string;
  nickname: string;
  visibility: string;
  role: string;
  gender?: string;
  age?: number;
  country?: string;
  vip_subscriptions?: {
    end_date: string;
    is_active: boolean;
  }[];
}

export const useVipUsers = () => {
  const { data: vipUsers, isLoading, error, refetch } = useQuery({
    queryKey: ["vip-users"],
    queryFn: async () => {
      try {
        // Fetch VIP users from Firebase
        const profilesRef = collection(db, 'profiles');
        const vipQuery = query(
          profilesRef,
          where("role", "==", "vip")
        );
        
        const querySnapshot = await getDocs(vipQuery);
        const users: VipUser[] = [];
        
        // Process user documents
        for (const doc of querySnapshot.docs) {
          const userData = doc.data();
          
          // Fetch subscription data for this user
          const subscriptionsRef = collection(db, 'vip_subscriptions');
          const subscriptionsQuery = query(
            subscriptionsRef,
            where("user_id", "==", doc.id)
          );
          
          const subscriptionsSnapshot = await getDocs(subscriptionsQuery);
          const subscriptions = subscriptionsSnapshot.docs.map(subDoc => subDoc.data());
          
          users.push({
            id: doc.id,
            ...userData,
            vip_subscriptions: subscriptions.map(sub => ({
              end_date: sub.end_date,
              is_active: sub.is_active
            }))
          } as VipUser);
        }
        
        return users;
      } catch (err) {
        console.error("Failed to fetch VIP users:", err);
        return [];
      }
    },
  });

  return {
    vipUsers: vipUsers || [],
    isLoading,
    error,
    refetch
  };
};
