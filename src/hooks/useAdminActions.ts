
import { useState } from "react";
import { supabase } from "@/lib/supabase";
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
      // Call RPC function with security definer for proper auth check
      const { data, error } = await supabase.rpc('admin_kick_user', {
        target_user_id: userId
      });

      if (error) throw error;

      // Send real-time notification to the user
      const channel = supabase.channel(`admin-actions-${userId}`);
      await channel.subscribe();
      await channel.send({
        type: 'broadcast',
        event: 'kick',
        payload: {}
      });
      
      // Update user visibility status
      const { error: visibilityError } = await supabase
        .from('profiles')
        .update({ visibility: 'offline' })
        .eq('id', userId);

      if (visibilityError) {
        console.warn('Error updating visibility, but user was kicked:', visibilityError);
      }

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
        }[duration] || 0);
      
      // Call RPC function with security definer for proper auth check
      const { data, error } = await supabase.rpc('admin_ban_user', {
        target_user_id: userId,
        ban_reason: reason,
        ban_expires_at: expiresAt?.toISOString() || null
      });

      if (error) throw error;

      // Send real-time notification to the user
      const channel = supabase.channel(`admin-actions-${userId}`);
      await channel.subscribe();
      await channel.send({
        type: 'broadcast',
        event: 'ban',
        payload: { reason }
      });

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
      // Call RPC function with security definer
      const { data, error } = await supabase.rpc('admin_unban_user', {
        target_user_id: userId
      });

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
        }[duration] || 0);

      // Call RPC function to upgrade user with security definer
      const { data, error } = await supabase.rpc('admin_upgrade_user_to_vip', {
        target_user_id: userId,
        subscription_end_date: endDate?.toISOString() || null
      });

      if (error) throw error;

      // Send real-time notification to the user
      const channel = supabase.channel(`admin-actions-${userId}`);
      await channel.subscribe();
      await channel.send({
        type: 'broadcast',
        event: 'vip-status-change',
        payload: { status: true }
      });

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
      // Call RPC function to downgrade user with security definer
      const { data, error } = await supabase.rpc('admin_downgrade_vip_user', {
        target_user_id: userId
      });

      if (error) throw error;

      // Send real-time notification to the user
      const channel = supabase.channel(`admin-actions-${userId}`);
      await channel.subscribe();
      await channel.send({
        type: 'broadcast',
        event: 'vip-status-change',
        payload: { status: false }
      });

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
