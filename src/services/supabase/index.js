// Supabase 서비스 인덱스 파일
// 모든 Supabase 관련 모듈을 하나의 진입점으로 통합

// 기본 클라이언트 내보내기
export { supabase } from './client';
export { default as supabaseClient } from './client';

// 환경 및 설정 내보내기
export {
  supabaseUrl,
  supabaseAnonKey,
  DEFAULT_BUCKET,
  isWeb,
  isHermesEngine,
  isInFallbackMode,
  setFallbackMode
} from './config';

// 네트워크 유틸리티 내보내기
export {
  safeFetch,
  timeoutPromise
} from './network';

// 채팅 기능 내보내기
export {
  createChatChannel
} from './chat';

// 인증 기능 내보내기
export {
  signInAnonymously,
  getCurrentUserId,
  signOut
} from './auth';

// 진단 기능 내보내기
export {
  testSupabaseConnection,
  diagnoseSupabaseIssues
} from './diagnostic';

// 스토리지 기능 내보내기
export {
  ensureBucketExists,
  uploadFileToSupabase
} from './storage';

// 기본 내보내기 - 메인 클라이언트
import { supabase } from './client';
export default supabase;
