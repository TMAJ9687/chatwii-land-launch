
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

interface RawVipUserData {
  id: string;
  nickname: string;
  visibility: string;
  role: string;
  gender?: string;
  age?: number;
  country?: string;
  vip_subscriptions: {
    end_date: string;
    is_active: boolean;
  };
}

export const useVipUsers = () => {
  const { data: vipUsers, isLoading, refetch } = useQuery({
    queryKey: ["vip-users"],
    queryFn: async () => {
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
      
      // Transform the data to match the VipUser interface
      return (data as RawVipUserData[]).map(user => ({
        ...user,
        // Ensure vip_subscriptions is always an array
        vip_subscriptions: user.vip_subscriptions ? [user.vip_subscriptions] : []
      })) as VipUser[];
    },
  });

  return {
    vipUsers,
    isLoading,
    refetch
  };
};
