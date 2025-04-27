
import React, { createContext, useContext, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createDocument, deleteDocument, queryDocuments } from '@/lib/firebase';
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
  const [showRules, setShowRules] = useState<boolean>(false);
  const [acceptedRules, setAcceptedRules] = useState<boolean>(false);
  const [activeSidebar, setActiveSidebar] = useState<'none' | 'inbox' | 'history' | 'blocked'>('none');
  const [showReportPopup, setShowReportPopup] = useState<boolean>(false);
  
  const navigate = useNavigate();
  const { blockedUsers, blockUser, fetchBlockedUsers } = useBlockedUsers();
  const isBlocked = selectedUserId ? blockedUsers.includes(selectedUserId) : false;

  const handleCloseChat = () => {
    setSelectedUserId(null);
    setSelectedUserNickname('');
  };

  const handleUserSelect = (userId: string, nickname: string) => {
    setSelectedUserId(userId);
    setSelectedUserNickname(nickname || 'User');
    navigate('/chat');
  };

  const handleAcceptRules = useCallback(async () => {
    // Implementation depends on how rules acceptance is stored
    // For now, just set the local state
    setAcceptedRules(true);
    setShowRules(false);
    
    // In a real implementation, you would store this in a database
    // Example:
    // await createDocument('user_preferences', currentUserId, { acceptedRules: true });
  }, []);

  const checkRulesAccepted = useCallback(async () => {
    // Implementation depends on how rules acceptance is stored
    // For now, just check the local state
    if (!acceptedRules) {
      setShowRules(true);
    }
    
    // In a real implementation, you would check from the database
    // Example:
    // const userPrefs = await getDocument('user_preferences', currentUserId);
    // if (!userPrefs?.acceptedRules) {
    //   setShowRules(true);
    // }
  }, [acceptedRules]);

  const handleBlockUser = useCallback(async () => {
    if (selectedUserId) {
      await blockUser(selectedUserId, localStorage.getItem('userId'));
      handleCloseChat();
    }
  }, [selectedUserId, blockUser]);
  
  // Fetch blocked users on mount
  React.useEffect(() => {
    fetchBlockedUsers(localStorage.getItem('userId'));
  }, [fetchBlockedUsers]);

  const value = {
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
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};
