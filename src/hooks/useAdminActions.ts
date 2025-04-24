
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useVipUsers } from "./useVipUsers";
import { useStandardUsers } from "./useStandardUsers";

export type BanDuration = '1day' | '1week' | '1month' | 'permanent';
export type VipDuration = '1month' | '3months' | 'permanent'; 

export const useAdminActions = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { refetch: refetchVipUsers } = useVipUsers();
  const { refetch: refetchStandardUsers } = useStandardUsers();

  const kickUser = async (userId: string) => {
    setIsProcessing(true);
    try {
      // First verify we are an admin
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Authentication required");
        return false;
      }
      
      const { data: adminCheck, error: adminError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
        
      if (adminError || adminCheck?.role !== 'admin') {
        toast.error("Admin privileges required");
        return false;
      }
      
      // Now update the visibility
      const { error } = await supabase.rpc('admin_kick_user', { target_user_id: userId });
      
      if (error) {
        console.error('Admin kick user error:', error);
        throw error;
      }
      
      // Also attempt to update the user's realtime presence
      // This doesn't solve presence immediately, but helps with future refresh
      const { error: visibilityError } = await supabase
        .from("profiles")
        .update({ visibility: "offline" })
        .eq("id", userId);
      
      if (visibilityError) {
        console.error('Failed to update visibility:', visibilityError);
      }
      
      toast.success("User kicked successfully");
      refetchVipUsers();
      refetchStandardUsers();
      return true;
    } catch (error) {
      console.error('Failed to kick user:', error);
      toast.error("Failed to kick user");
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const banUser = async (userId: string, reason: string, duration: BanDuration) => {
    setIsProcessing(true);
    try {
      const expiresAt = duration === 'permanent' ? null : 
        new Date(Date.now() + {
          '1day': 24 * 60 * 60 * 1000,
          '1week': 7 * 24 * 60 * 60 * 1000,
          '1month': 30 * 24 * 60 * 60 * 1000,
        }[duration] || 0).toISOString();

      // Get admin ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Authentication required");
        return false;
      }
      
      // Verify admin role
      const { data: adminCheck, error: adminError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
        
      if (adminError || adminCheck?.role !== 'admin') {
        toast.error("Admin privileges required");
        return false;
      }
      
      // Create ban record using RPC function
      const { error } = await supabase.rpc('admin_ban_user', { 
        target_user_id: userId,
        ban_reason: reason,
        ban_expires_at: expiresAt
      });

      if (error) throw error;
      
      toast.success("User banned successfully");
      refetchStandardUsers();
      refetchVipUsers();
      return true;
    } catch (error) {
      console.error('Failed to ban user:', error);
      toast.error("Failed to ban user");
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const unbanUser = async (userId: string) => {
    setIsProcessing(true);
    try {
      // First verify we are an admin
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Authentication required");
        return false;
      }
      
      const { error } = await supabase.rpc('admin_unban_user', { target_user_id: userId });
      
      if (error) throw error;
      
      toast.success("User unbanned successfully");
      refetchStandardUsers();
      return true;
    } catch (error) {
      console.error('Failed to unban user:', error);
      toast.error("Failed to unban user");
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const upgradeToVip = async (userId: string, duration: VipDuration) => {
    setIsProcessing(true);
    try {
      const endDate = duration === 'permanent' ? null : 
        new Date(Date.now() + {
          '1month': 30 * 24 * 60 * 60 * 1000,
          '3months': 90 * 24 * 60 * 60 * 1000,
        }[duration] || 0).toISOString();

      // First verify we are an admin
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Authentication required");
        return false;
      }
      
      const { error } = await supabase.rpc('admin_upgrade_user_to_vip', { 
        target_user_id: userId,
        subscription_end_date: endDate
      });
      
      if (error) throw error;
      
      toast.success("User upgraded to VIP successfully");
      refetchStandardUsers();
      refetchVipUsers();
      return true;
    } catch (error) {
      console.error('Failed to upgrade user:', error);
      toast.error("Failed to upgrade user to VIP");
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const downgradeFromVip = async (userId: string) => {
    setIsProcessing(true);
    try {
      // First verify we are an admin
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Authentication required");
        return false;
      }
      
      const { error } = await supabase.rpc('admin_downgrade_vip_user', { target_user_id: userId });
      
      if (error) throw error;
      
      toast.success("User downgraded from VIP successfully");
      refetchVipUsers();
      refetchStandardUsers();
      return true;
    } catch (error) {
      console.error('Failed to downgrade user:', error);
      toast.error("Failed to downgrade user from VIP");
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    kickUser,
    banUser,
    unbanUser,
    upgradeToVip,
    downgradeFromVip
  };
};
