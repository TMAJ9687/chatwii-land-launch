
import { ref, set, get } from "firebase/database";
import { realtimeDb } from "@/integrations/firebase/client";
import { queryDocuments } from "@/lib/firebase";
import { createLogger } from "@/utils/logger";
import { getMessagesPath, getConversationId } from "@/utils/channelUtils";
import { MessageWithMedia } from "@/types/message";

const logger = createLogger("syncService");

/**
 * Service to synchronize data between Firestore and Realtime Database
 * This ensures real-time functionality works correctly with Firestore data model
 */
export const syncService = {
  /**
   * Synchronize messages between two users
   * Gets messages from Firestore and pushes them to Realtime Database
   */
  syncMessages: async (userId1: string, userId2: string): Promise<boolean> => {
    try {
      const conversationId = getConversationId(userId1, userId2);
      const path = getMessagesPath(conversationId);
      
      // Check if we need to sync by comparing the message counts
      const rtdbRef = ref(realtimeDb, path);
      const rtdbSnapshot = await get(rtdbRef);
      const rtdbExists = rtdbSnapshot.exists();
      const rtdbCount = rtdbExists ? Object.keys(rtdbSnapshot.val() || {}).length : 0;
      
      // Query Firestore messages between these users
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
      
      const allMessages = [...fromUser1, ...fromUser2].filter(msg => 
        msg && typeof msg === 'object' && msg.id
      );
      
      // If no messages in Firestore or counts match, we can skip sync
      if (allMessages.length === 0 || (rtdbExists && rtdbCount === allMessages.length)) {
        logger.debug(`No sync needed for ${conversationId}: RTDB=${rtdbCount}, Firestore=${allMessages.length}`);
        return true;
      }
      
      // Get additional data for messages from Firestore
      const messageIds = allMessages.map(msg => msg.id).filter(Boolean);
      
      const [mediaRecords, reactionRecords] = await Promise.all([
        queryDocuments('message_media', [
          { field: 'message_id', operator: 'in', value: messageIds }
        ]),
        queryDocuments('message_reactions', [
          { field: 'message_id', operator: 'in', value: messageIds }
        ])
      ]);
      
      // Group by message ID for quick lookup
      const mediaByMessageId = mediaRecords.reduce((acc: Record<string, any>, media: any) => {
        if (media && media.message_id) {
          acc[media.message_id] = media;
        }
        return acc;
      }, {});
      
      const reactionsByMessageId = reactionRecords.reduce((acc: Record<string, any[]>, reaction: any) => {
        if (reaction && reaction.message_id) {
          if (!acc[reaction.message_id]) {
            acc[reaction.message_id] = [];
          }
          acc[reaction.message_id].push(reaction);
        }
        return acc;
      }, {});
      
      // Create the complete message objects with media and reactions
      const processedMessages: Record<string, MessageWithMedia> = {};
      
      allMessages.forEach(message => {
        if (!message || !message.id) return;
        
        processedMessages[message.id] = {
          id: message.id,
          content: message.content || '',
          sender_id: message.sender_id || '',
          receiver_id: message.receiver_id || '',
          is_read: Boolean(message.is_read),
          created_at: message.created_at,
          updated_at: message.updated_at,
          deleted_at: message.deleted_at,
          translated_content: message.translated_content,
          language_code: message.language_code,
          reply_to: message.reply_to,
          media: mediaByMessageId[message.id] || null,
          reactions: reactionsByMessageId[message.id] || [],
          participants: message.participants || [message.sender_id, message.receiver_id].filter(Boolean)
        };
      });
      
      // Push to Realtime Database
      await set(rtdbRef, processedMessages);
      logger.info(`Synced ${Object.keys(processedMessages).length} messages to RTDB for ${conversationId}`);
      
      return true;
    } catch (error) {
      logger.error("Error syncing messages:", error);
      return false;
    }
  },
  
  /**
   * Check sync status and perform sync for conversations that need it
   */
  checkAndSyncConversation: async (currentUserId: string, selectedUserId: string): Promise<boolean> => {
    if (!currentUserId || !selectedUserId) return false;
    
    try {
      return await syncService.syncMessages(currentUserId, selectedUserId);
    } catch (error) {
      logger.error("Error in checkAndSyncConversation:", error);
      return false;
    }
  }
};
