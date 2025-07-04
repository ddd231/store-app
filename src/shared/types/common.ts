// 공통 타입 정의

export interface User {
  id: string;
  email: string;
  user_metadata?: {
    username?: string;
    full_name?: string;
    avatar_url?: string;
    role?: 'admin' | 'developer' | 'user';
  };
  user_profiles?: UserProfile;
}

export interface UserProfile {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  is_premium?: boolean;
  is_admin?: boolean;
  premium_expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Work {
  id: string;
  title: string;
  content?: string;
  description?: string;
  image_url?: string;
  type: 'painting' | 'novel';
  category?: string;
  author_id: string;
  author_name: string;
  is_public: boolean;
  is_bookmarked?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  room_id: string;
  content: string;
  sender_id: string;
  sender_name: string;
  type: 'chat' | 'file' | 'system';
  attachment?: MessageAttachment;
  reply_to?: {
    message: string;
    username: string;
  };
  is_read: boolean;
  created_at: string;
}

export interface MessageAttachment {
  type: 'image' | 'document';
  name: string;
  url: string;
  size?: number;
  mime_type?: string;
}

export interface ChatRoom {
  id: string;
  name: string;
  type: 'direct' | 'group';
  creator_id: string;
  participant_count: number;
  last_message?: Message;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  status: number;
}

export interface QueryFilters {
  category?: string;
  author_id?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

// 컴포넌트 Props 타입
export interface BaseComponentProps {
  style?: any;
  testID?: string;
}

export interface NavigationProps {
  navigation: any;
  route: any;
}

// 상태 관리 타입
export interface AuthState {
  user: User | null;
  session: any;
  loading: boolean;
  isAuthenticated: boolean;
}

// 에러 타입
export interface AppError extends Error {
  code?: string;
  status?: number;
  details?: any;
}