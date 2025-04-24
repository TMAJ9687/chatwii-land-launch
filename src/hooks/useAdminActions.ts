
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
      const { error } = await supabase
        .from("profiles")
        .update({ visibility: "offline" })
        .eq("id", userId);

      if (error) throw error;
      
      toast.success("User kicked successfully");
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
      
      // Create ban record
      const { error: banError } = await supabase
        .from('bans')
        .insert({
          user_id: userId,
          reason,
          admin_id: user?.id,
          expires_at: expiresAt,
        });

      if (banError) throw banError;

      // Set user offline
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ visibility: 'offline' })
        .eq('id', userId);

      if (updateError) throw updateError;
      
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
      const { error } = await supabase
        .from("bans")
        .delete()
        .eq("user_id", userId);

      if (error) throw error;
      
      toast.success("User unbanned successfully");
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

      // Update profile to VIP
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          role: 'vip',
          vip_status: true 
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      // Create subscription record
      const { error: subscriptionError } = await supabase
        .from('vip_subscriptions')
        .insert({
          user_id: userId,
          start_date: new Date().toISOString(),
          end_date: endDate,
          is_active: true,
          payment_provider: 'admin_granted'
        });

      if (subscriptionError) throw subscriptionError;
      
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
      // Update profile to standard
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          role: 'standard',
          vip_status: false 
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      // Deactivate VIP subscriptions
      const { error: subscriptionError } = await supabase
        .from('vip_subscriptions')
        .update({ is_active: false })
        .eq('user_id', userId);

      if (subscriptionError) throw subscriptionError;
      
      toast.success("User downgraded from VIP successfully");
      refetchVipUsers();
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
