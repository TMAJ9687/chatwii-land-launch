
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { toast } from 'sonner';
import { useBlockedUsers } from '@/hooks/useBlockedUsers';

type ChatContextType = {
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
};

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserNickname, setSelectedUserNickname] = useState<string>('');
  const [showRules, setShowRules] = useState(false);
  const [acceptedRules, setAcceptedRules] = useState(false);
  const [activeSidebar, setActiveSidebar] = useState<'none' | 'inbox' | 'history' | 'blocked'>('none');
  const [showReportPopup, setShowReportPopup] = useState(false);
  
  const { blockedUsers, blockUser } = useBlockedUsers();

  const handleCloseChat = useCallback(() => {
    setSelectedUserId(null);
  }, []);

  const handleUserSelect = useCallback(async (userId: string, nickname: string) => {
    setSelectedUserId(userId);
    setSelectedUserNickname(nickname);
  }, []);

  const handleAcceptRules = useCallback(() => {
    setAcceptedRules(true);
    localStorage.setItem('rulesAccepted', 'true');
    setShowRules(false);
  }, []);

  const checkRulesAccepted = useCallback(() => {
    const rulesAccepted = localStorage.getItem('rulesAccepted');
    if (rulesAccepted === 'true') {
      setShowRules(false);
      setAcceptedRules(true);
    } else {
      setShowRules(true);
      setAcceptedRules(false);
    }
  }, []);

  const isBlocked = selectedUserId ? blockedUsers.includes(selectedUserId) : false;

  const handleBlockUser = useCallback(() => {
    if (selectedUserId && !isBlocked) {
      blockUser(selectedUserId);
      toast.success("User blocked successfully");
    }
  }, [selectedUserId, isBlocked, blockUser]);

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
    handleBlockUser
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
