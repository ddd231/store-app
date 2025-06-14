// Supabase 설정 모듈
import { Platform } from 'react-native';

// Supabase URL과 키 설정
export const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
export const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// 기본 버킷 이름
export const DEFAULT_BUCKET = 's';

// 환경 감지
export const isWeb = Platform.OS === 'web';
export const isHermesEngine = typeof HermesInternal !== 'undefined';

// 연결 재시도 설정
export const MAX_RETRIES = 3;
export const RETRY_DELAY = 1000;

// 웹 환경에서는 재시도 횟수와 딜레이 감소 (무한 로딩 방지)
export const WEB_MAX_RETRIES = 1;
export const WEB_RETRY_DELAY = 500;

// 실제 사용할 재시도 값
export const EFFECTIVE_MAX_RETRIES = isWeb ? WEB_MAX_RETRIES : MAX_RETRIES;
export const EFFECTIVE_RETRY_DELAY = isWeb ? WEB_RETRY_DELAY : RETRY_DELAY;

// 요청 타임아웃 설정
export const REQUEST_TIMEOUT = isWeb ? 8000 : 15000;

// 폴백 모드 상태 변수 (비활성화)
let _fallbackMode = false;

// 폴백 모드 상태 확인 함수
export const isInFallbackMode = () => {
  return _fallbackMode;
};

// 폴백 모드 설정 함수
export const setFallbackMode = (value) => {
  _fallbackMode = value;
};

// 환경 로깅

export default {
  supabaseUrl,
  supabaseAnonKey,
  DEFAULT_BUCKET,
  isWeb,
  isHermesEngine,
  EFFECTIVE_MAX_RETRIES,
  EFFECTIVE_RETRY_DELAY,
  REQUEST_TIMEOUT,
  isInFallbackMode,
  setFallbackMode
};
