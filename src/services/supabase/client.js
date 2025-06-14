// Supabase 클라이언트 메인 모듈
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

import { 
  supabaseUrl, 
  supabaseAnonKey, 
  isWeb, 
  isInFallbackMode 
} from './config';
import { safeFetch } from './network';
import { initRealtimePolyfills } from './realtime-polyfill';

// Hermes 엔진 환경에서 필요한 폴리필 초기화
initRealtimePolyfills();

/**
 * 안전한 Supabase 클라이언트 생성 함수
 * @returns {Object} Supabase 클라이언트 인스턴스
 */
export const createSafeSupabaseClient = () => {
  
  // Supabase 클라이언트 생성
  const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: !isWeb, // 웹에서는 URL에서 세션 감지 비활성화
    },
    // 웹에서는 안전한 fetch 함수 사용
    global: {
      fetch: isWeb ? safeFetch : undefined,
    },
    // 부가 옵션
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });
  
  // 데이터베이스 인터페이스 강화
  const enhancedFrom = (table) => {
    const original = supabaseClient.from(table);
    
    // 안전한 메소드 확장
    return {
      ...original,
      select: async (...args) => {
        try {
          return await original.select(...args);
        } catch (error) {
          console.error(`[Supabase] ${table} 선택 중 오류:`, error);
          return { data: [], error };
        }
      },
      insert: async (...args) => {
        try {
          return await original.insert(...args);
        } catch (error) {
          console.error(`[Supabase] ${table} 삽입 중 오류:`, error);
          return { data: null, error };
        }
      },
      update: async (...args) => {
        try {
          return await original.update(...args);
        } catch (error) {
          console.error(`[Supabase] ${table} 업데이트 중 오류:`, error);
          return { data: null, error };
        }
      },
      delete: async (...args) => {
        try {
          return await original.delete(...args);
        } catch (error) {
          console.error(`[Supabase] ${table} 삭제 중 오류:`, error);
          return { data: null, error };
        }
      }
    };
  };
  
  // 스토리지 인터페이스 강화
  const enhancedStorage = (bucket) => {
    const original = supabaseClient.storage.from(bucket);
    
    // 안전한 메소드 확장
    return {
      ...original,
      upload: async (...args) => {
        try {
          return await original.upload(...args);
        } catch (error) {
          console.error(`[Supabase] ${bucket} 업로드 중 오류:`, error);
          return { data: null, error };
        }
      },
      download: async (...args) => {
        try {
          return await original.download(...args);
        } catch (error) {
          console.error(`[Supabase] ${bucket} 다운로드 중 오류:`, error);
          return { data: null, error };
        }
      },
      getPublicUrl: (...args) => {
        try {
          return original.getPublicUrl(...args);
        } catch (error) {
          console.error(`[Supabase] ${bucket} 공개 URL 가져오기 중 오류:`, error);
          return { data: { publicUrl: '' }, error };
        }
      }
    };
  };
  
  // 강화된 클라이언트 반환
  return {
    ...supabaseClient,
    // 강화된 from 메소드 추가
    from: enhancedFrom,
    // 스토리지 메소드 강화
    storage: {
      ...supabaseClient.storage,
      from: enhancedStorage
    },
    // 안전한 인증 메소드
    auth: {
      ...supabaseClient.auth,
      getSession: async () => {
        try {
          return await supabaseClient.auth.getSession();
        } catch (error) {
          console.error('[Supabase] 세션 가져오기 중 오류:', error);
          return { data: { session: null }, error };
        }
      },
      signOut: async () => {
        try {
          return await supabaseClient.auth.signOut();
        } catch (error) {
          console.error('[Supabase] 로그아웃 중 오류:', error);
          return { error };
        }
      },
      onAuthStateChange: (callback) => {
        try {
          const { data } = supabaseClient.auth.onAuthStateChange(callback);
          return { data, unsubscribe: data?.subscription?.unsubscribe || (() => {}) };
        } catch (error) {
          console.error('[Supabase] 인증 상태 변경 감지 중 오류:', error);
          return { unsubscribe: () => {} };
        }
      }
    }
  };
};

// Supabase 클라이언트 인스턴스 생성
export const supabase = createSafeSupabaseClient();


export default supabase;
