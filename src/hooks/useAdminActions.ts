
import { useState } from "react";
import { doc, collection, query, where, getDocs, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { toast } from "sonner";
import { useVipUsers } from "./useVipUsers";
import { useStandardUsers } from "./useStandardUsers";
import { ref, onValue, set, push, onDisconnect, get } from 'firebase/database';
import { realtimeDb } from '@/integrations/firebase/client';

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
      // Get the user profile
      const userRef = doc(db, 'profiles', userId);
      
      // Update user visibility status to offline
      await updateDoc(userRef, { visibility: 'offline' });
      
      // Send real-time notification via Firebase Realtime Database
      const notificationRef = push(ref(realtimeDb, `notifications/${userId}`));
      await set(notificationRef, {
        type: 'kick',
        timestamp: serverTimestamp()
      });
      
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
      
      // Create ban record
      await addDoc(collection(db, 'bans'), {
        user_id: userId,
        admin_id: auth.currentUser?.uid,
        reason: reason,
        expires_at: expiresAt ? expiresAt.toISOString() : null,
        created_at: new Date().toISOString()
      });
      
      // Update user profile status
      const userRef = doc(db, 'profiles', userId);
      await updateDoc(userRef, { visibility: 'offline' });
      
      // Send real-time notification
      const notificationRef = push(ref(realtimeDb, `notifications/${userId}`));
      await set(notificationRef, {
        type: 'ban',
        reason: reason,
        timestamp: serverTimestamp()
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
      // Find and delete all ban records for this user
      const bansQuery = query(
        collection(db, 'bans'),
        where('user_id', '==', userId)
      );
      
      const banDocs = await getDocs(bansQuery);
      
      const deletePromises = banDocs.docs.map(doc => {
        return updateDoc(doc.ref, { expires_at: new Date().toISOString() });
      });
      
      await Promise.all(deletePromises);
      
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

      // Update user profile
      const userRef = doc(db, 'profiles', userId);
      await updateDoc(userRef, {
        role: 'vip',
        vip_status: true
      });
      
      // Create subscription record
      await addDoc(collection(db, 'vip_subscriptions'), {
        user_id: userId,
        start_date: new Date().toISOString(),
        end_date: endDate ? endDate.toISOString() : null,
        is_active: true,
        payment_provider: 'admin_granted',
        subscription_plan: duration === 'permanent' ? 'permanent' : 'admin_grant',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      // Send real-time notification
      const notificationRef = push(ref(realtimeDb, `notifications/${userId}`));
      await set(notificationRef, {
        type: 'vip-status-change',
        status: true,
        timestamp: serverTimestamp()
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
      // Update user profile
      const userRef = doc(db, 'profiles', userId);
      await updateDoc(userRef, {
        role: 'standard',
        vip_status: false
      });
      
      // Update subscription records
      const subscriptionsQuery = query(
        collection(db, 'vip_subscriptions'),
        where('user_id', '==', userId),
        where('is_active', '==', true)
      );
      
      const subscriptionDocs = await getDocs(subscriptionsQuery);
      
      const updatePromises = subscriptionDocs.docs.map(doc => {
        return updateDoc(doc.ref, { 
          is_active: false,
          updated_at: new Date().toISOString()
        });
      });
      
      await Promise.all(updatePromises);
      
      // Send real-time notification
      const notificationRef = push(ref(realtimeDb, `notifications/${userId}`));
      await set(notificationRef, {
        type: 'vip-status-change',
        status: false,
        timestamp: serverTimestamp()
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
