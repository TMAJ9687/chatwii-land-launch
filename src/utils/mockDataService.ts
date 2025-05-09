
import { MessageWithMedia } from '@/types/message';

// Mock user data
export const mockUsers = [
  {
    user_id: 'mock-user-1',
    nickname: 'John',
    gender: 'male',
    age: 28,
    country: 'US',
    role: 'standard',
    vip_status: false,
    avatar_url: null,
    is_current_user: false,
    avatarInitial: 'J',
    avatarBgColor: 'bg-blue-100',
    avatarTextColor: 'text-blue-600',
    flagEmoji: '🇺🇸'
  },
  {
    user_id: 'mock-user-2',
    nickname: 'Emma',
    gender: 'female',
    age: 24,
    country: 'UK',
    role: 'vip',
    vip_status: true,
    avatar_url: null,
    is_current_user: false,
    avatarInitial: 'E',
    avatarBgColor: 'bg-purple-100',
    avatarTextColor: 'text-purple-600',
    flagEmoji: '🇬🇧'
  },
  {
    user_id: 'mock-user-3',
    nickname: 'Miguel',
    gender: 'male',
    age: 30,
    country: 'ES',
    role: 'standard',
    vip_status: false,
    avatar_url: null,
    is_current_user: false,
    avatarInitial: 'M',
    avatarBgColor: 'bg-green-100',
    avatarTextColor: 'text-green-600',
    flagEmoji: '🇪🇸'
  }
];

// Mock messages
export const mockMessages: MessageWithMedia[] = [
  {
    id: 'mock-msg-1',
    content: 'Hi there! How are you doing today?',
    sender_id: 'mock-user-1',
    receiver_id: 'current-user',
    is_read: true,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    media: null,
    reactions: []
  },
  {
    id: 'mock-msg-2',
    content: "I'm doing well, thanks for asking! How about you?",
    sender_id: 'current-user',
    receiver_id: 'mock-user-1',
    is_read: true,
    created_at: new Date(Date.now() - 3500000).toISOString(),
    media: null,
    reactions: []
  },
  {
    id: 'mock-msg-3',
    content: "Just wanted to check in. Let's catch up soon!",
    sender_id: 'mock-user-1',
    receiver_id: 'current-user',
    is_read: false,
    created_at: new Date(Date.now() - 1800000).toISOString(),
    media: null,
    reactions: []
  },
  {
    id: 'mock-msg-4',
    content: "Hello from a VIP user! Here's something special.",
    sender_id: 'mock-user-2',
    receiver_id: 'current-user',
    is_read: false,
    created_at: new Date(Date.now() - 900000).toISOString(),
    media: {
      id: 'mock-media-1',
      message_id: 'mock-msg-4',
      user_id: 'mock-user-2',
      file_url: 'https://picsum.photos/400/300',
      media_type: 'image',
      created_at: new Date(Date.now() - 900000).toISOString()
    },
    reactions: [{
      id: 'mock-reaction-1',
      message_id: 'mock-msg-4',
      user_id: 'current-user',
      emoji: 'like',
      created_at: new Date(Date.now() - 800000).toISOString()
    }]
  }
];

export const mockCurrentUser = {
  id: 'current-user',
  nickname: 'You',
  displayName: 'You',
  email: 'demo@example.com',
  photoURL: null,
  role: 'standard',
  vip_status: false,
  created_at: new Date(Date.now() - 86400000).toISOString(),
  country: 'US',
  gender: 'prefer_not_to_say',
  age: 25
};

// Helper function to get mock messages between current user and a specific user
export const getMockMessagesForUser = (userId: string): MessageWithMedia[] => {
  if (userId === 'mock-user-1') {
    return mockMessages.filter(msg => 
      (msg.sender_id === 'mock-user-1' && msg.receiver_id === 'current-user') ||
      (msg.sender_id === 'current-user' && msg.receiver_id === 'mock-user-1')
    );
  } else if (userId === 'mock-user-2') {
    return mockMessages.filter(msg => 
      (msg.sender_id === 'mock-user-2' && msg.receiver_id === 'current-user') ||
      (msg.sender_id === 'current-user' && msg.receiver_id === 'mock-user-2')
    );
  }
  return [];
};
