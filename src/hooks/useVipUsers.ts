
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
        const { data, error } = await supabase
          .from("profiles")
          .select(`
            *, 
            vip_subscriptions (
              end_date,
              is_active
            )
          `)
          .eq("role", "vip")
          .order("nickname");

        if (error) throw error;
        
        if (!data || data.length === 0) {
          return [];
        }
        
        // Transform the data to match the VipUser interface
        return data.map(user => ({
          ...user,
          // Ensure vip_subscriptions is always an array
          vip_subscriptions: Array.isArray(user.vip_subscriptions) 
            ? user.vip_subscriptions 
            : (user.vip_subscriptions ? [user.vip_subscriptions] : [])
        })) as VipUser[];
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
