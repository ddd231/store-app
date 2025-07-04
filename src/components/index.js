/**
 * 컴포넌트 모듈 인덱스
 * 모든 공통 컴포넌트를 여기서 export하여 임포트를 간소화
 */

// Common Components
export { default as Button } from '../shared/components/Button';
export { default as Header } from '../shared/components/Header';
export { default as LoadingSpinner } from '../shared/components/LoadingSpinner';
export { default as EmptyState } from '../shared/components/EmptyState';
export { default as ErrorBoundary } from '../shared/components/ErrorBoundary';
export { default as WorkCard } from '../shared/components/WorkCard';

// Layout Components
export { default as Screen } from '../shared/components/Screen';

// Auth Components - features 폴더에서 import
export { default as LoginForm } from '../features/auth/components/LoginForm';
export { default as SignupForm } from '../features/auth/components/SignupForm';

// Legacy Components (기존 컴포넌트들 - 점진적으로 마이그레이션)
export { default as QRCodeModal } from './QRCodeModal';
export { default as HomeMenu } from './HomeMenu';
export { default as FileUploadButton } from '../shared/components/FileUploadButton';
export { default as MessageReply } from '../features/chat/components/MessageReply';
export { default as SupabaseTest } from './SupabaseTest';