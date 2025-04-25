
import { ChatArea } from '@/components/ChatArea';
import { MessageInput } from '@/components/MessageInput';
import { Message } from '@/types/message';

interface ChatContentProps {
  selectedUserId: string | null;
  selectedUserNickname: string;
  currentUserId: string;
  messages: Message[];
  onClose: () => void;
  onSendMessage: (content: string, imageUrl?: string) => void;
  onMessagesRead: () => void;
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
  if (!selectedUserId) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <div className="mb-6 text-5xl">👋</div>
        <h2 className="text-2xl font-bold mb-2">Welcome to Chatwii</h2>
        <p className="text-muted-foreground max-w-md">
          Select a user from the list to start chatting
        </p>
      </div>
    );
  }

  return (
    <>
      <ChatArea
        messages={messages}
        currentUserId={currentUserId}
        selectedUser={{
          id: selectedUserId,
          nickname: selectedUserNickname
        }}
        onClose={onClose}
        onMessagesRead={onMessagesRead}
      />

      <MessageInput
        onSendMessage={onSendMessage}
        currentUserId={currentUserId}
        receiverId={selectedUserId}
      />
    </>
  );
};
