
import { useState } from 'react';
import { toast } from 'sonner';
import { useBlockedUsers } from './useBlockedUsers';

export const useChatState = () => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserNickname, setSelectedUserNickname] = useState<string>('');
  const [showRules, setShowRules] = useState(false);
  const [acceptedRules, setAcceptedRules] = useState(false);
  const [activeSidebar, setActiveSidebar] = useState<'none' | 'inbox' | 'history' | 'blocked'>('none');
  const [showReportPopup, setShowReportPopup] = useState(false);
  const { blockedUsers, blockUser } = useBlockedUsers();

  const handleCloseChat = () => {
    setSelectedUserId(null);
  };

  const handleUserSelect = async (userId: string, nickname: string) => {
    setSelectedUserId(userId);
    setSelectedUserNickname(nickname);
  };

  const handleAcceptRules = () => {
    setAcceptedRules(true);
    localStorage.setItem('rulesAccepted', 'true');
    setShowRules(false);
  };

  const checkRulesAccepted = () => {
    const rulesAccepted = localStorage.getItem('rulesAccepted');
    if (rulesAccepted === 'true') {
      setShowRules(false);
      setAcceptedRules(true);
    } else {
      setShowRules(true);
      setAcceptedRules(false);
    }
  };

  const isBlocked = selectedUserId ? blockedUsers.includes(selectedUserId) : false;

  const handleBlockUser = () => {
    if (selectedUserId && !isBlocked) {
      blockUser(selectedUserId);
      toast.success("User blocked successfully");
    }
  };

  return {
    selectedUserId,
    selectedUserNickname,
    showRules,
    setShowRules,
    acceptedRules,
    activeSidebar,
    setActiveSidebar,
    handleCloseChat,
    handleUserSelect,
    handleAcceptRules,
    checkRulesAccepted,
    isBlocked,
    setShowReportPopup,
    handleBlockUser
  };
};
