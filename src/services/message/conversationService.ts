
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  DocumentData
} from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { createLogger } from "@/utils/logger";
import { MessageWithMedia } from "@/types/message";
import { formatTimestamp } from "./utils";

const logger = createLogger("conversationService");

/**
 * Service methods related to handling conversations between users
 */
export const conversationService = {
  /**
   * Get a conversation between two users
   */
  async getConversation(userId1: string, userId2: string): Promise<MessageWithMedia[]> {
    try {
      // Fetch both directions at once
      const [fromUser1, fromUser2] = await Promise.all([
        getDocs(query(
          collection(db, "messages"),
          where("sender_id", "==", userId1),
          where("receiver_id", "==", userId2),
          orderBy("created_at", "asc")
        )),
        getDocs(query(
          collection(db, "messages"),
          where("sender_id", "==", userId2),
          where("receiver_id", "==", userId1),
          orderBy("created_at", "asc")
        ))
      ]);

      // Combine messages from both directions
      const messages: DocumentData[] = [
        ...fromUser1.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        ...fromUser2.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      ];

      // Get message IDs for batch queries
      const messageIds = messages.map(msg => msg.id);
      
      // Skip media and reactions queries if no messages
      if (messageIds.length === 0) {
        return [];
      }

      // Fetch media and reactions for all messages
      const [mediaSnapshot, reactionsSnapshot] = await Promise.all([
        getDocs(query(
          collection(db, "message_media"),
          where("message_id", "in", messageIds)
        )),
        getDocs(query(
          collection(db, "message_reactions"),
          where("message_id", "in", messageIds)
        ))
      ]);

      // Create lookup maps for media and reactions
      const mediaByMessageId: Record<string, DocumentData> = {};
      mediaSnapshot.forEach(doc => {
        const media = { id: doc.id, ...doc.data() } as DocumentData;
        if (media.message_id) {
          mediaByMessageId[media.message_id] = media;
        }
      });

      const reactionsByMessageId: Record<string, DocumentData[]> = {};
      reactionsSnapshot.forEach(doc => {
        const reaction = { id: doc.id, ...doc.data() } as DocumentData;
        if (reaction.message_id) {
          if (!reactionsByMessageId[reaction.message_id]) {
            reactionsByMessageId[reaction.message_id] = [];
          }
          reactionsByMessageId[reaction.message_id].push(reaction);
        }
      });

      // Sort by timestamp
      const sortedMessages = messages
        .map(message => ({
          id: message.id,
          content: message.content || '',
          sender_id: message.sender_id,
          receiver_id: message.receiver_id,
          is_read: Boolean(message.is_read),
          created_at: formatTimestamp(message.created_at),
          updated_at: message.updated_at ? formatTimestamp(message.updated_at) : null,
          deleted_at: message.deleted_at ? formatTimestamp(message.deleted_at) : null,
          translated_content: message.translated_content || null,
          language_code: message.language_code || null,
          reply_to: message.reply_to || null,
          media: mediaByMessageId[message.id] ? {
            id: mediaByMessageId[message.id].id,
            message_id: mediaByMessageId[message.id].message_id,
            user_id: mediaByMessageId[message.id].user_id,
            file_url: mediaByMessageId[message.id].file_url,
            media_type: mediaByMessageId[message.id].media_type,
            created_at: mediaByMessageId[message.id].created_at
          } : null,
          reactions: (reactionsByMessageId[message.id] || []).map(reaction => ({
            id: reaction.id,
            message_id: reaction.message_id,
            user_id: reaction.user_id,
            emoji: reaction.emoji,
            created_at: reaction.created_at
          })),
          participants: message.participants || [message.sender_id, message.receiver_id]
        }))
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      return sortedMessages;
    } catch (error) {
      logger.error("Error fetching conversation:", error);
      throw new Error("Failed to fetch conversation");
    }
  },
  
  /**
   * Delete all messages between two users
   */
  async deleteConversation(userId1: string, userId2: string): Promise<void> {
    try {
      // Get all messages between these users
      const [fromUser1, fromUser2] = await Promise.all([
        getDocs(query(
          collection(db, "messages"),
          where("sender_id", "==", userId1),
          where("receiver_id", "==", userId2)
        )),
        getDocs(query(
          collection(db, "messages"),
          where("sender_id", "==", userId2),
          where("receiver_id", "==", userId1)
        ))
      ]);
      
      // Mark all messages as deleted
      const updatePromises = [
        ...fromUser1.docs.map(doc => 
          doc.ref.update({
            deleted_at: serverTimestamp(),
            content: "[Message deleted]",
            updated_at: serverTimestamp()
          })
        ),
        ...fromUser2.docs.map(doc => 
          doc.ref.update({
            deleted_at: serverTimestamp(),
            content: "[Message deleted]",
            updated_at: serverTimestamp()
          })
        )
      ];
      
      await Promise.all(updatePromises);
    } catch (error) {
      logger.error("Error deleting conversation:", error);
      throw new Error("Failed to delete conversation");
    }
  }
};
