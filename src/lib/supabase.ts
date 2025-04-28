// This file now re-exports Firebase functions instead of Supabase
import { db, auth, storage, realtimeDb } from '@/integrations/firebase/client';
import { getDatabase, ref, onValue, set, push, remove, onDisconnect, serverTimestamp, off } from 'firebase/database';
import { 
  signInAnonymousUser, 
  signUpWithEmail, 
  signInWithEmail, 
  signOutUser,
  getCurrentUser,
  createUserProfile,
  getUserProfile,
  subscribeToAuthChanges
} from '@/integrations/firebase/auth';

import {
  createDocument,
  getDocument,
  queryDocuments,
  updateDocument,
  deleteDocument,
  subscribeToDocument,
  subscribeToQuery
} from '@/integrations/firebase/firestore';

import {
  uploadFile,
  getFileDownloadURL,
  deleteFile
} from '@/integrations/firebase/storage';

// Export Firebase functions to replace Supabase functionality
export { 
  db, auth, storage, realtimeDb,
  signInAnonymousUser, signUpWithEmail, signInWithEmail, signOutUser,
  getCurrentUser, createUserProfile, getUserProfile, subscribeToAuthChanges,
  createDocument, getDocument, queryDocuments, updateDocument, deleteDocument,
  subscribeToDocument, subscribeToQuery,
  uploadFile, getFileDownloadURL, deleteFile
};

// Track all active channels and listeners for proper cleanup
const activeChannels = new Map();
const activeListeners = new Map();

// Mock implementation of Supabase's API structure using Firebase
export const supabase = {
  auth: {
    getUser: async () => {
      const currentUser = getCurrentUser();
      return { data: { user: currentUser }, error: null };
    },
    getSession: async () => {
      const currentUser = getCurrentUser();
      return { data: { session: currentUser ? { user: currentUser } : null }, error: null };
    },
    signOut: async () => {
      await signOutUser();
      return { error: null };
    },
    onAuthStateChange: (callback: any) => {
      const unsub = subscribeToAuthChanges((user) => {
        if (callback) callback('SIGNED_IN', { user });
      });
      return { data: { subscription: { unsubscribe: unsub } } };
    },
    updateUser: async ({ password }: { password: string }) => {
      console.warn("updateUser not fully implemented");
      return { error: null };
    }
  },
  from: (table: string) => {
    return {
      select: (fields?: string) => {
        return {
          eq: async (field: string, value: any) => {
            try {
              const results = await queryDocuments(table, [
                { field, operator: '==', value }
              ]);
              return { data: results, error: null };
            } catch (error) {
              return { data: null, error };
            }
          },
          in: async (field: string, values: any[]) => {
            try {
              const results = await queryDocuments(table, [
                { field, operator: 'in', value: values }
              ]);
              return { data: results, error: null };
            } catch (error) {
              return { data: null, error };
            }
          },
          single: async () => {
            try {
              const results = await queryDocuments(table, []);
              return { data: results[0] || null, error: null };
            } catch (error) {
              return { data: null, error };
            }
          },
          maybeSingle: async () => {
            try {
              const results = await queryDocuments(table, []);
              return { data: results[0] || null, error: null };
            } catch (error) {
              return { data: null, error };
            }
          },
          order: (field: string, { ascending = true } = {}) => {
            // This is a stub - would need proper implementation
            return {
              order: () => ({}),
              eq: async () => ({ data: [], error: null }),
              in: async () => ({ data: [], error: null }),
            };
          }
        };
      },
      insert: async (data: any) => {
        try {
          const docId = await createDocument(table, data);
          return { data: { id: docId }, error: null };
        } catch (error) {
          return { error };
        }
      },
      update: async (data: any) => {
        return {
          eq: async (field: string, value: any) => {
            try {
              // This is simplified - would need proper implementation
              const docs = await queryDocuments(table, [{ field, operator: '==', value }]);
              if (docs.length > 0) {
                await updateDocument(table, docs[0].id, data);
              }
              return { error: null };
            } catch (error) {
              return { error };
            }
          }
        };
      },
      delete: () => {
        return {
          eq: async (field: string, value: any) => {
            try {
              // This is simplified - would need proper implementation
              const docs = await queryDocuments(table, [{ field, operator: '==', value }]);
              if (docs.length > 0) {
                await deleteDocument(table, docs[0].id);
              }
              return { error: null };
            } catch (error) {
              return { error };
            }
          }
        };
      }
    };
  },
  rpc: (func: string, params: any) => {
    // This is a stub for RPC calls
    if (func === 'is_nickname_available') {
      return {
        data: true, // Just return true for now
        error: null
      };
    }
    console.warn(`RPC function ${func} not implemented`);
    return { data: null, error: new Error(`RPC function ${func} not implemented`) };
  },
  storage: {
    from: (bucket: string) => {
      return {
        upload: async (path: string, file: File) => {
          try {
            const url = await uploadFile(bucket, path, file);
            return { data: { path }, error: null };
          } catch (error) {
            return { data: null, error };
          }
        },
        getPublicUrl: (path: string) => {
          return { data: { publicUrl: `storage/${bucket}/${path}` } };
        }
      };
    }
  },
  channel: (channelName: string) => {
    const channelId = `channel-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    console.log(`Creating Firebase channel substitute for ${channelName} (${channelId})`);
    
    // Store the channel info
    const channelInfo = {
      id: channelId,
      name: channelName,
      listeners: new Map(),
      status: 'CLOSED'
    };
    
    activeChannels.set(channelId, channelInfo);
    
    // Return a compatibility layer for Supabase channels using Firebase
    const channel = {
      on: (event?: string, filter?: any, callback?: any) => {
        console.log(`Setting up Firebase listener for ${channelName} event ${event}`, filter);
        
        // Keep track of the listener
        if (callback && filter) {
          const listenerId = `${channelId}-${event}-${Date.now()}`;
          channelInfo.listeners.set(listenerId, { callback, filter });
        }
        
        return {
          on: (innerEvent?: string, innerFilter?: any, innerCallback?: any) => {
            if (innerCallback && innerFilter) {
              const listenerId = `${channelId}-${innerEvent}-${Date.now()}`;
              channelInfo.listeners.set(listenerId, { callback: innerCallback, filter: innerFilter });
            }
            return { 
              subscribe: (cb?: any) => {
                if (cb) cb('SUBSCRIBED');
                channelInfo.status = 'SUBSCRIBED';
                return channel;
              }
            };
          },
          subscribe: (cb?: any) => {
            if (cb) cb('SUBSCRIBED');
            channelInfo.status = 'SUBSCRIBED';
            return channel;
          }
        };
      },
      subscribe: (callback?: any) => {
        if (callback) callback('SUBSCRIBED');
        channelInfo.status = 'SUBSCRIBED';
        return channel;
      },
      track: async () => {
        // Implement presence using Firebase Realtime DB
        return channel;
      },
      send: async (params: any) => {
        console.log('Channel send called with', params);
        return 'OK';
      },
      unsubscribe: () => {
        console.log(`Unsubscribing from channel ${channelName} (${channelId})`);
        channelInfo.status = 'CLOSED';
        // Clean up all listeners for this channel
        channelInfo.listeners.forEach((listener, id) => {
          // If we had actual Firebase listeners here, we'd remove them
        });
        channelInfo.listeners.clear();
        activeChannels.delete(channelId);
        return channel;
      }
    };
    
    return channel;
  },
  removeChannel: (channel?: any) => {
    if (!channel) return;
    
    try {
      // If the channel has an unsubscribe method, call it
      if (channel.unsubscribe && typeof channel.unsubscribe === 'function') {
        channel.unsubscribe();
      }
      
      // Clean up any associated listeners
      if (channel.id && activeChannels.has(channel.id)) {
        const channelInfo = activeChannels.get(channel.id);
        channelInfo.listeners.forEach((listener: any, id: string) => {
          // If we had actual Firebase listeners here, we'd remove them
        });
        activeChannels.delete(channel.id);
      }
    } catch (error) {
      console.error('Error removing channel:', error);
    }
  },
  functions: {
    invoke: async (funcName: string, { body }: { body: any }) => {
      console.warn(`Function ${funcName} not implemented`);
      return { data: null, error: new Error(`Function ${funcName} not implemented`) };
    }
  }
};

// Helper to clean up all listeners and channels on app exit/reload
export const cleanupAllFirebaseListeners = () => {
  // Clean up all realtime database listeners
  activeListeners.forEach((ref, id) => {
    try {
      off(ref);
    } catch (e) {
      console.error(`Error cleaning up listener ${id}:`, e);
    }
  });
  activeListeners.clear();
  
  // Clean up all channels
  activeChannels.forEach((channelInfo, id) => {
    channelInfo.listeners.clear();
  });
  activeChannels.clear();
};

// Add cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', cleanupAllFirebaseListeners);
}

export default supabase;
