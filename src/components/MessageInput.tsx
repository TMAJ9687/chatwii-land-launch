
import React, { useEffect, useState } from "react";
import { MessageInputContainer } from "./chat/input/MessageInputContainer";
import { MessageInputPlaceholder } from "./chat/input/MessageInputPlaceholder";
import { ReplyComposer } from "./chat/ReplyComposer";
import { MessageWithMedia } from "@/types/message";
import { useMessageActions } from "@/hooks/useMessageActions";
import { queryDocuments } from "@/lib/firebase";
import { isMockUser } from "@/utils/mockUsers";

interface MessageInputProps {
  onSendMessage: (content: string, imageUrl?: string) => void;
  currentUserId: string | null;
  receiverId: string;
  isVipUser?: boolean;
  onTypingStatusChange?: (isTyping: boolean) => void;
  disabled?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  currentUserId,
  receiverId,
  isVipUser = false,
  onTypingStatusChange,
  disabled = false,
}) => {
  const isMockVipUser = isMockUser(receiverId);

  const {
    isReplying,
    replyToMessageId,
    setReplyContent,
    cancelReply,
    handleReplyToMessage,
    replyContent,
  } = useMessageActions(currentUserId || "", isVipUser);

  const [replyToMessage, setReplyToMessage] = useState<MessageWithMedia | null>(null);

  // Fetch the message being replied to (with media if present)
  useEffect(() => {
    if (!replyToMessageId) {
      setReplyToMessage(null);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const replyMessages = await queryDocuments("messages", [
          { field: "id", operator: "==", value: replyToMessageId },
        ]);
        if (replyMessages.length > 0 && !cancelled) {
          const replyMsg = replyMessages[0];
          const mediaRecords = await queryDocuments("message_media", [
            { field: "message_id", operator: "==", value: replyMsg.id },
          ]);
          setReplyToMessage({
            ...replyMsg,
            media:
              mediaRecords.length > 0
                ? {
                    id: mediaRecords[0].id,
                    message_id: mediaRecords[0].message_id,
                    user_id: mediaRecords[0].user_id,
                    file_url: mediaRecords[0].file_url,
                    media_type: mediaRecords[0].media_type,
                    created_at: mediaRecords[0].created_at,
                  }
                : null,
            reactions: [],
          });
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Error fetching reply message:", error);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [replyToMessageId]);

  const handleSendReply = (content: string, imageUrl?: string) => {
    if (!replyToMessageId || !content.trim() || disabled) return;
    handleReplyToMessage(replyToMessageId, content);
    onSendMessage(content, imageUrl);
    cancelReply();
  };

  return (
    <>
      {isReplying && replyToMessage && (
        <ReplyComposer
          originalMessage={replyToMessage}
          onSendReply={handleSendReply}
          onCancel={cancelReply}
          disabled={disabled}
        />
      )}

      {!isReplying && (
        <>
          {isMockVipUser ? (
            <MessageInputPlaceholder />
          ) : (
            <MessageInputContainer
              onSendMessage={onSendMessage}
              currentUserId={currentUserId || ""}
              receiverId={receiverId}
              onTypingStatusChange={onTypingStatusChange}
              disabled={disabled}
              isVipUser={isVipUser}
            />
          )}
        </>
      )}
    </>
  );
};
