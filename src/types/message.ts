
import { Timestamp } from 'firebase/firestore';

export interface MessageMedia {
  id: string;
  message_id: string;
  user_id: string;
  file_url: string;
  media_type: 'image' | 'voice' | 'video';
  created_at: Date | Timestamp | string;
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: Date | Timestamp | string;
}

export interface MessageWithMedia {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  is_read: boolean;
  created_at: Date | string | Timestamp;
  updated_at?: Date | string | Timestamp;
  deleted_at?: Date | string | Timestamp | null;
  translated_content?: string | null;
  language_code?: string | null;
  reply_to?: string | null;
  media: MessageMedia | null;
  reactions: MessageReaction[];
}
