import { getDocument, queryDocuments } from '@/lib/firebase';
import { MessageWithMedia } from '@/types/message';
import { ref, set, get, remove } from 'firebase/database';
import { realtimeDb } from '@/integrations/firebase/client';
import { getConversationId, getMessageChannelPath } from '@/utils/channelUtils';

/**
 * Service to synchronize data between Firestore and Realtime Database
 */
export class SyncService {
  private static instance: SyncService;
  private syncQueue: Map<string, boolean> = new Map();
  private processingQueue = false;
  private lastSyncAttempt: Record<string, number> = {};
  
  // Singleton pattern
  public static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }
  
  /**
   * Queue a conversation for synchronization
   * @param userId1 First user ID in the conversation
   * @param userId2 Second user ID in the conversation
   * @returns Promise that resolves when sync is queued
   */
  public async queueSync(userId1: string | null, userId2: string | null): Promise<void> {
    if (!userId1 || !userId2) {
      console.warn('Cannot queue sync: Missing user IDs');
      return Promise.resolve();
    }
    
    const conversationId = getConversationId(userId1, userId2);
    if (!conversationId) {
      console.warn('Cannot queue sync: Invalid conversation ID');
      return Promise.resolve();
    }
    
    console.log(`Queuing sync for conversation ${conversationId}`);
    this.syncQueue.set(conversationId, true);
    
    // Throttle syncs to prevent hammering the database
    const now = Date.now();
    if (this.lastSyncAttempt[conversationId] && 
        now - this.lastSyncAttempt[conversationId] < 5000) {
      console.log(`Throttling sync for ${conversationId}, last attempt was ${now - this.lastSyncAttempt[conversationId]}ms ago`);
      return Promise.resolve();
    }
    
    this.lastSyncAttempt[conversationId] = now;
    
    if (!this.processingQueue) {
      this.processQueue();
    }
    
    return Promise.resolve();
  }
  
  /**
   * Process all queued sync operations
   */
  private async processQueue(): Promise<void> {
    if (this.syncQueue.size === 0) {
      this.processingQueue = false;
      return;
    }
    
    this.processingQueue = true;
    const conversationIds = Array.from(this.syncQueue.keys());
    
    for (const conversationId of conversationIds) {
      try {
        console.log(`Processing sync for conversation ${conversationId}`);
        await this.syncConversation(conversationId);
        this.syncQueue.delete(conversationId);
      } catch (error) {
        console.error(`Error syncing conversation ${conversationId}:`, error);
        // Keep in queue for retry but with backoff
        const retryCount = (this.lastSyncAttempt[`${conversationId}_retries`] || 0) + 1;
        this.lastSyncAttempt[`${conversationId}_retries`] = retryCount;
        
        // Max 5 retries with exponential backoff
        if (retryCount <= 5) {
          setTimeout(() => {
            this.syncQueue.set(conversationId, true);
            this.processQueue();
          }, 1000 * Math.pow(2, retryCount - 1)); // 1s, 2s, 4s, 8s, 16s
        } else {
          console.error(`Gave up syncing conversation ${conversationId} after 5 retries`);
          // Remove from queue after max retries
          this.syncQueue.delete(conversationId);
        }
      }
    }
    
    // Process any remaining items or new additions
    setTimeout(() => this.processQueue(), 100);
  }
  
  /**
   * Synchronize a specific conversation between Firestore and Realtime DB
   * @param conversationId The conversation ID to synchronize
   */
  private async syncConversation(conversationId: string): Promise<void> {
    try {
      const [userId1, userId2] = conversationId.split('_');
      if (!userId1 || !userId2) {
        console.error('Invalid conversation ID format:', conversationId);
        return;
      }
      
      console.log(`Syncing messages for users ${userId1} and ${userId2}`);
      
      // Fetch messages from Firestore
      const [fromUser1, fromUser2] = await Promise.all([
        queryDocuments('messages', [
          { field: 'sender_id', operator: '==', value: userId1 },
          { field: 'receiver_id', operator: '==', value: userId2 }
        ]),
        queryDocuments('messages', [
          { field: 'sender_id', operator: '==', value: userId2 },
          { field: 'receiver_id', operator: '==', value: userId1 }
        ])
      ]);
      
      // Combine and prepare messages
      const allMessages = [...fromUser1, ...fromUser2].filter(msg => msg && msg.id);
      
      console.log(`Found ${allMessages.length} messages to sync for conversation ${conversationId}`);
      
      if (allMessages.length === 0) {
        // Even if there are no messages, still create an empty object in RTDB
        const messagePath = getMessageChannelPath(conversationId);
        const dbRef = ref(realtimeDb, messagePath);
        await set(dbRef, {});
        console.log(`Created empty message object for conversation ${conversationId}`);
        return;
      }
      
      // Get message IDs for batch queries
      const messageIds = allMessages.map(msg => msg.id);
      
      // Make batch queries for media and reactions
      const [mediaRecords, reactionRecords] = await Promise.all([
        queryDocuments('message_media', [
          { field: 'message_id', operator: 'in', value: messageIds }
        ]),
        queryDocuments('message_reactions', [
          { field: 'message_id', operator: 'in', value: messageIds }
        ])
      ]);
      
      console.log(`Found ${mediaRecords.length} media items and ${reactionRecords.length} reactions`);
      
      // Create lookup maps
      const mediaByMessageId = mediaRecords.reduce((acc, media) => {
        if (media && media.message_id) {
          acc[media.message_id] = media;
        }
        return acc;
      }, {} as Record<string, any>);
      
      const reactionsByMessageId = reactionRecords.reduce((acc, reaction) => {
        if (reaction && reaction.message_id) {
          if (!acc[reaction.message_id]) {
            acc[reaction.message_id] = [];
          }
          acc[reaction.message_id].push(reaction);
        }
        return acc;
      }, {} as Record<string, any[]>);
      
      // Process all messages
      const processedMessages = allMessages.map(message => {
        // Create a message object with all required fields
        return {
          id: message.id,
          content: message.content || '',
          sender_id: message.sender_id || '',
          receiver_id: message.receiver_id || '',
          is_read: Boolean(message.is_read),
          created_at: this.formatTimestamp(message.created_at),
          updated_at: this.formatTimestamp(message.updated_at),
          deleted_at: this.formatTimestamp(message.deleted_at),
          translated_content: message.translated_content,
          language_code: message.language_code,
          reply_to: message.reply_to,
          media: mediaByMessageId[message.id] || null,
          reactions: reactionsByMessageId[message.id] || [],
          participants: message.participants || [message.sender_id, message.receiver_id].filter(Boolean)
        };
      });
      
      // Sort messages by creation date
      const sortedMessages = processedMessages.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateA - dateB;
      });
      
      // Prepare data for Realtime Database update
      const messagesObject = sortedMessages.reduce((acc, msg) => {
        acc[msg.id] = msg;
        return acc;
      }, {} as Record<string, any>);
      
      // Update Realtime Database
      const messagePath = getMessageChannelPath(conversationId);
      console.log(`Writing to Realtime DB path: ${messagePath}`);
      const dbRef = ref(realtimeDb, messagePath);
      
      // Check if we need to update
      const currentSnapshot = await get(dbRef);
      const currentData = currentSnapshot.val();
      
      // Only update if data is different or if current data is null
      if (!currentData || JSON.stringify(currentData) !== JSON.stringify(messagesObject)) {
        await set(dbRef, messagesObject);
        console.log(`Synchronized ${sortedMessages.length} messages for conversation ${conversationId}`);
      } else {
        console.log(`No changes needed for conversation ${conversationId}`);
      }
    } catch (error) {
      console.error(`Error in syncConversation for ${conversationId}:`, error);
      throw error; // Re-throw to mark as failed in queue
    }
  }
  
  /**
   * Format timestamp to ISO string
   * @param timestamp Firebase timestamp or date
   * @returns ISO string or null
   */
  private formatTimestamp(timestamp: any): string | null {
    if (!timestamp) return null;
    
    if (timestamp instanceof Date) {
      return timestamp.toISOString();
    }
    
    if (typeof timestamp === 'object' && 'seconds' in timestamp) {
      return new Date((timestamp as any).seconds * 1000).toISOString();
    }
    
    if (typeof timestamp === 'string') {
      try {
        return new Date(timestamp).toISOString();
      } catch (e) {
        console.error('Invalid date string:', timestamp);
        return null;
      }
    }
    
    return null;
  }
  
  /**
   * Check if message exists in Realtime Database
   * @param conversationId Conversation ID
   * @param messageId Message ID
   * @returns Promise resolving to boolean
   */
  public async messageExistsInRealtimeDb(conversationId: string, messageId: string): Promise<boolean> {
    try {
      const messagePath = `${getMessageChannelPath(conversationId)}/${messageId}`;
      const dbRef = ref(realtimeDb, messagePath);
      const snapshot = await get(dbRef);
      return snapshot.exists();
    } catch (error) {
      console.error('Error checking message existence:', error);
      return false;
    }
  }
  
  /**
   * Clear conversation from Realtime Database (e.g., on deletion)
   * @param conversationId Conversation ID to clear
   */
  public async clearConversation(conversationId: string): Promise<void> {
    try {
      const messagePath = getMessageChannelPath(conversationId);
      const dbRef = ref(realtimeDb, messagePath);
      await remove(dbRef);
      console.log(`Cleared conversation ${conversationId} from Realtime Database`);
    } catch (error) {
      console.error(`Error clearing conversation ${conversationId}:`, error);
      throw error;
    }
  }
  
  /**
   * Debug utility to check the Realtime Database rules
   * @returns Promise resolving to boolean indicating if rules are correct
   */
  public async checkRealtimeDatabaseRules(): Promise<boolean> {
    try {
      // Try to read a value that should be readable if rules are set up correctly
      const testPath = 'presence/test';
      const testRef = ref(realtimeDb, testPath);
      await get(testRef);
      console.log('Realtime Database rules check: SUCCESS');
      return true;
    } catch (error: any) {
      if (error.code === 'PERMISSION_DENIED') {
        console.error('Realtime Database rules check: FAILED - Permission denied');
        console.error('Make sure your Realtime Database rules are configured correctly. Example:');
        console.error(`
{
  "rules": {
    "presence": {
      ".read": "auth !== null",
      "$uid": {
        ".write": "$uid === auth.uid"
      }
    },
    "messages": {
      "$conversation_id": {
        ".read": "auth !== null && $conversation_id.contains(auth.uid)",
        ".write": "auth !== null && $conversation_id.contains(auth.uid)"
      }
    },
    "reactions": {
      "$conversation_id": {
        ".read": "auth !== null && $conversation_id.contains(auth.uid)",
        ".write": "auth !== null && $conversation_id.contains(auth.uid)"
      }
    },
    ".read": false,
    ".write": false
  }
}`);
      } else {
        console.error('Realtime Database rules check: FAILED -', error);
      }
      return false;
    }
  }
}

// Export a singleton instance
export const syncService = SyncService.getInstance();
