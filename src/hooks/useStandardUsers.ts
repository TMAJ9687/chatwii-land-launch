
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "standard")
        .eq("visibility", "online")
        .order("nickname");

      if (error) throw error;
      return data as StandardUser[];
    },
  });

  return {
    standardUsers,
    isLoading,
    refetch
  };
};
