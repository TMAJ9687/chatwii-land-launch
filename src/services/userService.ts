import { db } from "@/lib/firebase";
import { collection, doc, addDoc, updateDoc, deleteDoc, getDoc, query, where, getDocs, Timestamp, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";

export type BanDuration = '1day' | '1week' | '1month' | 'permanent';
export type VipDuration = '1month' | '3months' | 'permanent';

// General user status management
export const updateUserVisibility = async (userId: string, visibility: 'online' | 'offline') => {
  try {
    const userRef = doc(db, "profiles", userId);
    await updateDoc(userRef, { visibility });
    return true;
  } catch (error) {
    console.error('Failed to update user visibility:', error);
    throw new Error(`Failed to update user visibility: ${(error as Error).message}`);
  }
};

// Ban user functionality
export const banUser = async (userId: string, reason: string, duration: BanDuration) => {
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
      reason,
      expires_at: expiresAt ? Timestamp.fromDate(expiresAt) : null,
      created_at: serverTimestamp()
    });

    // Set user offline
    await updateUserVisibility(userId, 'offline');
    
    return true;
  } catch (error) {
    console.error('Failed to ban user:', error);
    throw error;
  }
};

// VIP management
export const upgradeToVip = async (userId: string, duration: VipDuration) => {
  try {
    const endDate = duration === 'permanent' ? null : 
      new Date(Date.now() + {
        '1month': 30 * 24 * 60 * 60 * 1000,
        '3months': 90 * 24 * 60 * 60 * 1000,
      }[duration] || 0);

    // Update user profile
    const userRef = doc(db, "profiles", userId);
    await updateDoc(userRef, { 
      role: 'vip',
      vip_status: true 
    });

    // Create subscription record
    await addDoc(collection(db, 'vip_subscriptions'), {
      user_id: userId,
      start_date: serverTimestamp(),
      end_date: endDate ? Timestamp.fromDate(endDate) : null,
      is_active: true,
      payment_provider: 'admin_granted'
    });
    
    return true;
  } catch (error) {
    console.error('Failed to upgrade user:', error);
    throw error;
  }
};

export const downgradeFromVip = async (userId: string) => {
  try {
    // Update user profile
    const userRef = doc(db, "profiles", userId);
    await updateDoc(userRef, { 
      role: 'standard',
      vip_status: false 
    });

    // Deactivate subscriptions
    const subscriptionsRef = collection(db, 'vip_subscriptions');
    const subscriptionsQuery = query(
      subscriptionsRef, 
      where('user_id', '==', userId)
    );
    
    const querySnapshot = await getDocs(subscriptionsQuery);
    const updatePromises = querySnapshot.docs.map(doc => 
      updateDoc(doc.ref, { is_active: false })
    );
    
    await Promise.all(updatePromises);
    
    return true;
  } catch (error) {
    console.error('Failed to downgrade user:', error);
    throw error;
  }
};

// User data
export const getUserById = async (userId: string) => {
  try {
    const userDoc = await getDoc(doc(db, "profiles", userId));
    
    if (!userDoc.exists()) {
      throw new Error(`User not found: ${userId}`);
    }
    
    return { id: userDoc.id, ...userDoc.data() };
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw error;
  }
};

// Unban functionality
export const unbanUser = async (userId: string) => {
  try {
    const bansRef = collection(db, 'bans');
    const bansQuery = query(bansRef, where('user_id', '==', userId));
    
    const querySnapshot = await getDocs(bansQuery);
    const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
    
    await Promise.all(deletePromises);
    
    return true;
  } catch (error) {
    console.error('Failed to unban user:', error);
    throw error;
  }
};
