import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBlockedUsers } from '@/hooks/useBlockedUsers';

interface ChatContextProps {
  selectedUserId: string | null;
  selectedUserNickname: string;
  showRules: boolean;
  setShowRules: (show: boolean) => void;
  acceptedRules: boolean;
  activeSidebar: 'none' | 'inbox' | 'history' | 'blocked';
  setActiveSidebar: (sidebar: 'none' | 'inbox' | 'history' | 'blocked') => void;
  handleCloseChat: () => void;
  handleUserSelect: (userId: string, nickname: string) => void;
  handleAcceptRules: () => void;
  checkRulesAccepted: () => void;
  isBlocked: boolean;
  showReportPopup: boolean;
  setShowReportPopup: (show: boolean) => void;
  handleBlockUser: () => void;
}

const ChatContext = createContext<ChatContextProps | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserNickname, setSelectedUserNickname] = useState<string>('');
  const [showRules, setShowRules] = useState(false);
  const [acceptedRules, setAcceptedRules] = useState(false);
  const [activeSidebar, setActiveSidebar] = useState<'none' | 'inbox' | 'history' | 'blocked'>('none');
  const [showReportPopup, setShowReportPopup] = useState(false);

  const navigate = useNavigate();
  const { blockedUsers, blockUser, fetchBlockedUsers } = useBlockedUsers();
  const isBlocked = selectedUserId ? blockedUsers.includes(selectedUserId) : false;

  const handleCloseChat = useCallback(() => {
    setSelectedUserId(null);
    setSelectedUserNickname('');
  }, []);

  const handleUserSelect = useCallback((userId: string, nickname: string) => {
    setSelectedUserId(userId);
    setSelectedUserNickname(nickname || 'User');
    navigate('/chat');
  }, [navigate]);

  const handleAcceptRules = useCallback(() => {
    setAcceptedRules(true);
    setShowRules(false);
    // Optionally, save to DB for persistence
  }, []);

  const checkRulesAccepted = useCallback(() => {
    if (!acceptedRules) setShowRules(true);
    // Optionally, check from DB for persistence
  }, [acceptedRules]);

  const handleBlockUser = useCallback(async () => {
    if (selectedUserId) {
      const currentUserId = localStorage.getItem('userId');
      await blockUser(selectedUserId, currentUserId);
      handleCloseChat();
    }
  }, [selectedUserId, blockUser, handleCloseChat]);

  // Fetch blocked users on mount and whenever local userId changes
  useEffect(() => {
    const currentUserId = localStorage.getItem('userId');
    if (currentUserId) {
      fetchBlockedUsers(currentUserId);
    }
  }, [fetchBlockedUsers]);

  const value: ChatContextProps = {
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
    showReportPopup,
    setShowReportPopup,
    handleBlockUser,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};
