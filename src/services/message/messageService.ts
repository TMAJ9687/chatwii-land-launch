
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  serverTimestamp,
  DocumentData
} from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { createLogger } from "@/utils/logger";
import { MessageWithMedia, MessageMedia, MessageReaction } from "@/types/message";
import { formatTimestamp } from "./utils";

const logger = createLogger("messageService");

/**
 * Service methods for individual message operations
 */
export const messageService = {
  /**
   * Send a new message
   */
  async sendMessage(senderId: string, receiverId: string, content: string, imageUrl?: string): Promise<string> {
    try {
      // Create base message
      const messageData = {
        content: content || (imageUrl ? '[Image]' : ''),
        sender_id: senderId,
        receiver_id: receiverId,
        participants: [senderId, receiverId],
        is_read: false,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      };

      // Add the message to Firestore
      const messageRef = await addDoc(collection(db, "messages"), messageData);
      const messageId = messageRef.id;

      // If an image URL was provided, create a media record
      if (imageUrl) {
        await addDoc(collection(db, "message_media"), {
          message_id: messageId,
          user_id: senderId,
          file_url: imageUrl,
          media_type: imageUrl.includes('voice') ? 'voice' : 'image',
          created_at: serverTimestamp()
        });
      }

      return messageId;
    } catch (error) {
      logger.error("Error sending message:", error);
      throw new Error("Failed to send message");
    }
  },

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(senderId: string, receiverId: string): Promise<void> {
    try {
      // Get unread messages from this sender
      const unreadSnapshot = await getDocs(query(
        collection(db, "messages"),
        where("sender_id", "==", senderId),
        where("receiver_id", "==", receiverId),
        where("is_read", "==", false)
      ));

      // Update each message to mark as read
      const batch = [];
      for (const doc of unreadSnapshot.docs) {
        batch.push(updateDoc(doc.ref, {
          is_read: true,
          updated_at: serverTimestamp()
        }));
      }

      await Promise.all(batch);
    } catch (error) {
      logger.error("Error marking messages as read:", error);
      throw new Error("Failed to mark messages as read");
    }
  },

  /**
   * Get a single message by ID
   */
  async getMessage(messageId: string): Promise<MessageWithMedia | null> {
    try {
      const messageDoc = await getDoc(doc(db, "messages", messageId));
      
      if (!messageDoc.exists()) {
        return null;
      }
      
      const messageData = { id: messageDoc.id, ...messageDoc.data() } as DocumentData;
      
      // Get media and reactions
      const [mediaSnapshot, reactionsSnapshot] = await Promise.all([
        getDocs(query(
          collection(db, "message_media"),
          where("message_id", "==", messageId)
        )),
        getDocs(query(
          collection(db, "message_reactions"),
          where("message_id", "==", messageId)
        ))
      ]);
      
      // Process media
      let media: MessageMedia | null = null;
      if (mediaSnapshot.docs.length > 0) {
        const mediaData = { id: mediaSnapshot.docs[0].id, ...mediaSnapshot.docs[0].data() } as DocumentData;
        media = {
          id: mediaData.id,
          message_id: mediaData.message_id,
          user_id: mediaData.user_id,
          file_url: mediaData.file_url,
          media_type: mediaData.media_type,
          created_at: mediaData.created_at
        };
      }
      
      // Process reactions
      const reactions: MessageReaction[] = reactionsSnapshot.docs.map(doc => {
        const reactionData = { id: doc.id, ...doc.data() } as DocumentData;
        return {
          id: reactionData.id,
          message_id: reactionData.message_id,
          user_id: reactionData.user_id,
          emoji: reactionData.emoji,
          created_at: reactionData.created_at
        };
      });
      
      return {
        id: messageId,
        content: messageData.content || '',
        sender_id: messageData.sender_id,
        receiver_id: messageData.receiver_id,
        is_read: Boolean(messageData.is_read),
        created_at: formatTimestamp(messageData.created_at),
        updated_at: messageData.updated_at ? formatTimestamp(messageData.updated_at) : null,
        deleted_at: messageData.deleted_at ? formatTimestamp(messageData.deleted_at) : null,
        translated_content: messageData.translated_content || null,
        language_code: messageData.language_code || null,
        reply_to: messageData.reply_to || null,
        media,
        reactions
      };
    } catch (error) {
      logger.error("Error fetching message:", error);
      throw new Error("Failed to fetch message");
    }
  },
  
  /**
   * Delete a single message
   */
  async deleteMessage(messageId: string): Promise<void> {
    try {
      await updateDoc(doc(db, "messages", messageId), {
        deleted_at: serverTimestamp(),
        content: "[Message deleted]",
        updated_at: serverTimestamp()
      });
    } catch (error) {
      logger.error("Error deleting message:", error);
      throw new Error("Failed to delete message");
    }
  }
};
