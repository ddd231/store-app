// Shared Exports - default export 컴포넌트들
export { default as Button } from './components/Button';
export { default as Header } from './components/Header';
export { default as LoadingSpinner } from './components/LoadingSpinner';
export { default as EmptyState } from './components/EmptyState';
export { default as ErrorBoundary } from './components/ErrorBoundary';
export { default as WorkCard } from './components/WorkCard';
export { default as Screen } from './components/Screen';
export { default as OptimizedImage } from './components/OptimizedImage';
// FileUploadButton은 순환 참조를 피하기 위해 주석 처리
// export { default as FileUploadButton } from './components/FileUploadButton';

export * from './hooks/useOptimized';
export * from './hooks/useRateLimit';
export * from './hooks/useDebounce';

export * from './utils/adminUtils';
export * from './utils/errorUtils';
export * from './utils/fileValidator';
export * from './utils/logger';
export * from './utils/permissions';
export * from './utils/rateLimiter';
export * from './utils/sanitizer';
export * from './utils/secureStorage';
export * from './utils/userUtils';
export * from './utils/validation';

export { supabase, createChatChannel, uploadFileToSupabase, getCurrentUserId, testSupabaseConnection } from '../services/supabaseClient';
export { queryClient } from './services/queryClient';
// features 의존성 제거 (순환 참조 방지)
// export { useAuth } from '../features/auth/hooks/useAuth';
// export { useProfile } from '../features/profile/hooks/useProfile';