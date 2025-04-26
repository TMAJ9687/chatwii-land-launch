
export interface Message {
  id: number;
  content: string | null;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  is_read?: boolean;
  deleted_at?: string | null;
  reply_to?: number | null;
  translated_content?: string | null;
  language_code?: string | null;
  is_delivered?: boolean;
  is_typing?: boolean;
}

export interface MessageMedia {
  id: number;
  message_id: number;
  user_id: string;
  file_url: string;
  media_type: string;
  created_at: string;
}

export interface MessageReaction {
  id: number;
  message_id: number;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface MessageWithMedia extends Message {
  media?: MessageMedia | null;
  reactions?: MessageReaction[] | null;
}
