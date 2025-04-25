
import { ChatArea } from '@/components/ChatArea';
import { MessageWithMedia } from '@/types/message';

interface ChatContentProps {
  selectedUserId: string | null;
  selectedUserNickname: string;
  currentUserId: string;
  messages: MessageWithMedia[];
  onClose?: () => void;
  onSendMessage: (content: string, imageUrl?: string) => void;
  onMessagesRead?: () => void;
}

export const ChatContent = ({
  selectedUserId,
  selectedUserNickname,
  currentUserId,
  messages,
  onClose,
  onSendMessage,
  onMessagesRead,
}: ChatContentProps) => {
  if (!selectedUserId) return null;

  return (
    <ChatArea
      messages={messages}
      currentUserId={currentUserId}
      selectedUser={{
        id: selectedUserId,
        nickname: selectedUserNickname,
      }}
      onClose={onClose}
      onMessagesRead={onMessagesRead}
    />
  );
};
