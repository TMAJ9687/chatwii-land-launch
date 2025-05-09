
import { useMockMode } from '@/contexts/MockModeContext';
import { mockCurrentUser, mockUsers, getMockMessagesForUser } from '@/utils/mockDataService';
import { useState } from 'react';
import { toast } from 'sonner';

// Mock hook for authentication
export function useMockableAuth() {
  const { isMockMode } = useMockMode();
  const [mockIsAuthenticated, setMockIsAuthenticated] = useState(() => {
    return localStorage.getItem('mock_auth') === 'true';
  });

  // Mock login function
  const mockLogin = () => {
    localStorage.setItem('mock_auth', 'true');
    setMockIsAuthenticated(true);
    toast.success('Mock login successful');
    return Promise.resolve(true);
  };

  // Mock logout function
  const mockLogout = () => {
    localStorage.setItem('mock_auth', 'false');
    setMockIsAuthenticated(false);
    toast.success('Mock logout successful');
    return Promise.resolve(true);
  };

  return {
    isMockMode,
    mockIsAuthenticated,
    mockLogin,
    mockLogout,
    mockCurrentUser
  };
}

// Hook for online users
export function useMockableOnlineUsers() {
  const { isMockMode } = useMockMode();
  
  return {
    isMockMode,
    mockOnlineUsers: mockUsers
  };
}

// Hook for messages
export function useMockableMessages() {
  const { isMockMode } = useMockMode();
  
  const getMockMessages = (selectedUserId: string) => {
    return getMockMessagesForUser(selectedUserId);
  };
  
  return {
    isMockMode,
    getMockMessages
  };
}

// Mock function for sending messages
export function useMockableMessageSender() {
  const { isMockMode } = useMockMode();
  
  const sendMockMessage = (receiverId: string, content: string, imageUrl?: string) => {
    toast.success('Message sent in mock mode');
    return Promise.resolve({
      id: `mock-msg-${Date.now()}`,
      content,
      sender_id: 'current-user',
      receiver_id: receiverId,
      is_read: false,
      created_at: new Date().toISOString(),
      media: imageUrl ? {
        id: `mock-media-${Date.now()}`,
        message_id: `mock-msg-${Date.now()}`,
        user_id: 'current-user',
        file_url: imageUrl,
        media_type: 'image',
        created_at: new Date().toISOString()
      } : null,
      reactions: []
    });
  };
  
  return {
    isMockMode,
    sendMockMessage
  };
}
