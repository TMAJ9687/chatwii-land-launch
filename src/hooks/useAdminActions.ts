
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

  // Common error handler
  const handleError = (error: any, action: string) => {
    console.error(`Failed to ${action}:`, error);
    toast.error(`Failed to ${action}`);
    return false;
  };

  const kickUser = async (userId: string) => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ visibility: 'offline' })
        .eq('id', userId);

      if (error) throw error;

      const { error: channelError } = await supabase
        .from('profiles')
        .update({ visibility: 'offline' })
        .eq('id', userId);

      if (channelError) throw channelError;

      toast.success("User kicked successfully");
      refetchStandardUsers();
      refetchVipUsers();
      return true;
    } catch (error) {
      return handleError(error, "kick user");
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

      const { data, error } = await supabase
        .from('profiles')
        .update({ visibility: 'offline' })
        .eq('id', userId);

      if (error) throw error;

      // Create ban record
      const { error: banError } = await supabase
        .from('bans')
        .insert({
          user_id: userId,
          reason,
          expires_at: expiresAt,
        });

      if (banError) throw banError;
      
      toast.success("User banned successfully");
      refetchStandardUsers();
      refetchVipUsers();
      return true;
    } catch (error) {
      return handleError(error, "ban user");
    } finally {
      setIsProcessing(false);
    }
  };

  const unbanUser = async (userId: string) => {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('bans')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
      
      toast.success("User unbanned successfully");
      refetchStandardUsers();
      return true;
    } catch (error) {
      return handleError(error, "unban user");
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

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          role: 'vip',
          vip_status: true 
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      // Create subscription
      const { error: subError } = await supabase
        .from('vip_subscriptions')
        .insert({
          user_id: userId,
          end_date: endDate,
          is_active: true,
          payment_provider: 'admin_granted',
          subscription_plan: duration === 'permanent' ? 'permanent' : 'admin_grant'
        });

      if (subError) throw subError;

      toast.success("User upgraded to VIP successfully");
      refetchStandardUsers();
      refetchVipUsers();
      return true;
    } catch (error) {
      return handleError(error, "upgrade user to VIP");
    } finally {
      setIsProcessing(false);
    }
  };

  const downgradeFromVip = async (userId: string) => {
    setIsProcessing(true);
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          role: 'standard',
          vip_status: false 
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      // Deactivate subscriptions
      const { error: subError } = await supabase
        .from('vip_subscriptions')
        .update({ is_active: false })
        .eq('user_id', userId);

      if (subError) throw subError;

      toast.success("User downgraded from VIP successfully");
      refetchVipUsers();
      refetchStandardUsers();
      return true;
    } catch (error) {
      return handleError(error, "downgrade user from VIP");
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
