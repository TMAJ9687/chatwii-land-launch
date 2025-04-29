
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  DocumentData
} from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { createLogger } from "@/utils/logger";
import { MessageWithMedia, MessageMedia, MessageReaction } from "@/types/message";

const logger = createLogger("messageService");

// Helper to convert Firestore timestamp to ISO string
const formatTimestamp = (timestamp: any): string => {
  if (!timestamp) return new Date().toISOString();
  
  if (timestamp instanceof Timestamp) {
    return new Date(timestamp.toMillis()).toISOString();
  }
  
  if (timestamp instanceof Date) {
    return timestamp.toISOString();
  }
  
  if (typeof timestamp === 'object' && 'seconds' in timestamp) {
    return new Date((timestamp as any).seconds * 1000).toISOString();
  }
  
  if (typeof timestamp === 'string') {
    return timestamp;
  }
  
  return new Date().toISOString();
};

export const messageService = {
  // Get a conversation between two users
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
        const media = { id: doc.id, ...doc.data() };
        if (media.message_id) {
          mediaByMessageId[media.message_id] = media;
        }
      });

      const reactionsByMessageId: Record<string, DocumentData[]> = {};
      reactionsSnapshot.forEach(doc => {
        const reaction = { id: doc.id, ...doc.data() };
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

  // Send a new message
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

  // Mark messages as read
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

  // Get a single message by ID
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
  
  // Delete a single message
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
  },
  
  // Delete all messages between two users
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
      
      // Batch update to mark all as deleted
      const updatePromises = [
        ...fromUser1.docs.map(doc => 
          updateDoc(doc.ref, {
            deleted_at: serverTimestamp(),
            content: "[Message deleted]",
            updated_at: serverTimestamp()
          })
        ),
        ...fromUser2.docs.map(doc => 
          updateDoc(doc.ref, {
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
