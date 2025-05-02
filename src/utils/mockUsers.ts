
// Constants and utilities for handling mock users

// Use a proper UUID format that won't cause database errors but is clearly identifiable
export const MOCK_VIP_USER_ID = '00000000-0000-0000-0000-000000000000';

export const isMockUser = (userId?: string | null): boolean => {
  return userId === MOCK_VIP_USER_ID;
};

export const MOCK_VIP_USER = {
  user_id: MOCK_VIP_USER_ID,
  nickname: 'VIP_Amanda',
  role: 'vip',
  avatar_url: 'https://i.pravatar.cc/150?img=5',
  country: 'fr',
  gender: 'Female',
  age: 28,
  vip_status: true,
  profile_theme: 'gold',
  interests: ['Travel', 'Photography', 'Music'],
  is_current_user: false,
  isMockUser: true
};

export const getMockVipMessages = (currentUserId: string) => {
  // Provide some mock messages for the mock VIP user
  const now = new Date();
  
  return [
    {
      id: 1001,
      content: "Hi there! I'm a demo VIP user. You can see how messaging with VIP users would work, but this is just for demonstration purposes.",
      sender_id: MOCK_VIP_USER_ID,
      receiver_id: currentUserId,
      created_at: new Date(now.getTime() - 600000).toISOString(), // 10 minutes ago
      updated_at: new Date(now.getTime() - 600000).toISOString(), // same as created_at
      is_read: true,
      media: null,
      reactions: [], // Add empty reactions array
    },
    {
      id: 1002,
      content: "VIP users get additional features like unlimited image sharing and voice messages!",
      sender_id: MOCK_VIP_USER_ID,
      receiver_id: currentUserId,
      created_at: new Date(now.getTime() - 300000).toISOString(), // 5 minutes ago
      updated_at: new Date(now.getTime() - 300000).toISOString(), // same as created_at
      is_read: true,
      media: null,
      reactions: [], // Add empty reactions array
    }
  ];
};
