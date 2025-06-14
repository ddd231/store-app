// 웹 환경에서 안정적으로 동작하는 더미 Supabase 클라이언트
// 실제 Supabase 기능이 없는 모의 구현으로, 웹 환경에서 무한 로딩을 방지합니다.

import { Platform } from 'react-native';

// Supabase URL과 키 설정 (더미 - 실제로 사용되지 않음)
export const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co';
export const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'dummy_key';

// 기본 버킷 이름
export const DEFAULT_BUCKET = 's';

// 폴백 모드 상태 변수
export const isInFallbackMode = () => true;

// 더미 클라이언트 초기화 로그

// 더미 Supabase 클라이언트 - 모든 기능이 단순 성공 응답만 반환
export const supabase = {
  // 데이터베이스 작업
  from: (table) => ({
    select: (columns) => Promise.resolve({ data: [], error: null }),
    insert: (data) => Promise.resolve({ data: null, error: null }),
    update: (data) => Promise.resolve({ data: null, error: null }),
    delete: () => Promise.resolve({ data: null, error: null }),
    eq: () => ({ select: () => Promise.resolve({ data: [], error: null }) }),
    match: () => ({ select: () => Promise.resolve({ data: [], error: null }) }),
  }),
  
  // 스토리지 작업
  storage: {
    from: (bucket) => ({
      upload: (path, file) => Promise.resolve({ data: { path }, error: null }),
      download: (path) => Promise.resolve(new Blob()),
      getPublicUrl: (path) => ({ publicUrl: `https://example.com/${path}` }),
      list: (prefix) => Promise.resolve({ data: [], error: null }),
    }),
    listBuckets: () => Promise.resolve({ data: [{ name: DEFAULT_BUCKET }], error: null }),
    createBucket: (name) => Promise.resolve({ data: { name }, error: null }),
  },
  
  // 인증 작업
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    signInWithPassword: () => Promise.resolve({ data: { session: null, user: null }, error: null }),
    signOut: () => Promise.resolve({ error: null }),
    onAuthStateChange: (callback) => ({ 
      data: { 
        subscription: { 
        } 
      } 
    }),
  },
};

// 채팅 채널 생성 (모의 함수)
export const createChatChannel = (roomId) => {
  
  return {
    on: (event, callback) => {
      return {
        subscribe: () => ({
        })
      };
    },
    subscribe: () => ({
    })
  };
};

// 익명 로그인 함수 (완전 모의 구현)
export const signInAnonymously = async () => {
  
  // 항상 성공 응답 반환
  return {
    success: true,
    anonymous: true,
    user: { id: `anon_${Date.now()}` }
  };
};

// 연결 테스트 함수 (완전 모의 구현)
export const testSupabaseConnection = async () => {
  
  // 항상 성공 응답 반환
  return {
    success: true,
    message: '모의 연결 성공',
    data: { hasSession: false }
  };
};

// 기타 필요한 함수들 (모의 구현)
export const ensureBucketExists = async () => ({ success: true });
export const uploadFileToSupabase = async () => ({ success: true, data: { publicUrl: 'https://example.com/dummy.png' } });

// 기본 내보내기
export default supabase;

