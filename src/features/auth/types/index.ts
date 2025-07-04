// Auth Feature Types
import { User } from '../../../shared/types/common';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  password: string;
  username: string;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    user: User;
    session: any;
  };
  error?: {
    message: string;
    code?: string;
  };
}

export interface PasswordResetRequest {
  email: string;
}

export interface AuthFormProps {
  onSubmit: (credentials: LoginCredentials | SignupCredentials) => void;
  loading?: boolean;
  error?: string | null;
}

export interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: (credentials: LoginCredentials) => Promise<AuthResponse>;
  signUp: (credentials: SignupCredentials) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}