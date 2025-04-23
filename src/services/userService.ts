
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export type BanDuration = '1day' | '1week' | '1month' | 'permanent';
export type VipDuration = '1month' | '3months' | 'permanent';

// General user status management
export const updateUserVisibility = async (userId: string, visibility: 'online' | 'offline') => {
  const { error } = await supabase
    .from("profiles")
    .update({ visibility })
    .eq("id", userId);
  
  if (error) {
    throw new Error(`Failed to update user visibility: ${error.message}`);
  }
  
  return true;
};

// Ban user functionality
export const banUser = async (userId: string, reason: string, duration: BanDuration) => {
  const expiresAt = duration === 'permanent' ? null : 
    new Date(Date.now() + {
      '1day': 24 * 60 * 60 * 1000,
      '1week': 7 * 24 * 60 * 60 * 1000,
      '1month': 30 * 24 * 60 * 60 * 1000,
    }[duration] || 0).toISOString();

  // Create ban record
  const { error: banError } = await supabase
    .from('bans')
    .insert({
      user_id: userId,
      reason,
      expires_at: expiresAt,
    });

  if (banError) {
    throw new Error(`Failed to create ban record: ${banError.message}`);
  }

  // Set user offline
  await updateUserVisibility(userId, 'offline');
  
  return true;
};

// VIP management
export const upgradeToVip = async (userId: string, duration: VipDuration) => {
  const endDate = duration === 'permanent' ? null : 
    new Date(Date.now() + {
      '1month': 30 * 24 * 60 * 60 * 1000,
      '3months': 90 * 24 * 60 * 60 * 1000,
    }[duration] || 0).toISOString();

  // Update user profile
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ 
      role: 'vip',
      vip_status: true 
    })
    .eq('id', userId);

  if (profileError) {
    throw new Error(`Failed to upgrade user: ${profileError.message}`);
  }

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

  if (subscriptionError) {
    throw new Error(`Failed to create subscription: ${subscriptionError.message}`);
  }
  
  return true;
};

export const downgradeFromVip = async (userId: string) => {
  // Update user profile
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ 
      role: 'standard',
      vip_status: false 
    })
    .eq('id', userId);

  if (profileError) {
    throw new Error(`Failed to downgrade user: ${profileError.message}`);
  }

  // Deactivate subscriptions
  const { error: subscriptionError } = await supabase
    .from('vip_subscriptions')
    .update({ is_active: false })
    .eq('user_id', userId);

  if (subscriptionError) {
    throw new Error(`Failed to update subscription: ${subscriptionError.message}`);
  }
  
  return true;
};

// User data
export const getUserById = async (userId: string) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
    
  if (error) {
    throw new Error(`Could not fetch user: ${error.message}`);
  }
  
  return data;
};

// Unban functionality
export const unbanUser = async (userId: string) => {
  const { error } = await supabase
    .from("bans")
    .delete()
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to unban user: ${error.message}`);
  }
  
  return true;
};
