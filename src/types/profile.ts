
export interface Profile {
  id: string;
  nickname: string;
  country: string;
  gender: string;
  age: number;
  vip_status: boolean;
  role: string;
  interests: string[];
  visibility: string;
  avatar_url?: string;
  profile_theme?: string;
}

export interface UserInterest {
  interests: {
    name: string;
  };
}

export interface ProfileWithInterests extends Profile {
  user_interests: UserInterest[];
}

export interface UserListItemProps {
  name: string;
  gender: string;
  age: number;
  country: string;
  isVip?: boolean;
  interests: string[];
  isSelected?: boolean;
  onClick?: () => void;
  avatar?: string;
  profileTheme?: string;
}

export type ProfileTheme = 'default' | 'gold' | 'blue' | 'purple' | 'green';

export type VisibilityStatus = 'online' | 'invisible';
