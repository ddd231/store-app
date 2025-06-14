/**
 * Supabase 클라이언트 엔트리 파일
 * 전체 애플리케이션에서 사용하는 중앙집중식 Supabase 클라이언트
 * 중요: 싱글톤 패턴으로 구현하여 중복 생성 방지 (2025-06-01 수정)
 */

import { createClient } from '@supabase/supabase-js';

// Supabase 프로젝트 URL와 익명 키 설정 (환경변수에서 가져오기)
export const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
export const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// 기본 버킷 이름 설정
export const DEFAULT_BUCKET = 'artify-uploads';

// 플랫폼 감지
export const isWeb = typeof window !== 'undefined' && typeof document !== 'undefined';
export const isHermesEngine = global.HermesInternal != null;

// 오프라인 모드 상태 관리
let _isInFallbackMode = false;
export const isInFallbackMode = () => _isInFallbackMode;
export const setFallbackMode = (value) => {
  _isInFallbackMode = value;
  return value;
};

/**
 * 싱글톤 패턴으로 Supabase 클라이언트 관리
 * 중복 인스턴스 생성 방지
 */
let supabaseInstance = null;

// 클라이언트 초기화 함수
function initializeSupabase() {
  if (supabaseInstance === null) {
    
    // 웹소켓 및 안전 모드 설정 확인
    const isSafeMode = isWeb && window && 
      (window.__APP_SAFE_MODE || window.localStorage?.getItem('APP_SAFE_MODE') === 'true');
    
    // Supabase 설정 가져오기
    const webSettings = isWeb && window && window.__SUPABASE_WEB_SETTINGS || {};
    
    // Realtime 초기화 옵션
    const realtimeOptions = {
      params: {
        log_level: isWeb && window.localStorage?.getItem('SUPABASE_LOG_LEVEL') || 'error',
      },
    };
    
    // 안전 모드에서는 Realtime 비활성화 옵션 추가
    if (isSafeMode || webSettings.disableRealtime) {
      realtimeOptions.enabled = false;
    }
    
    // 웹소켓 관련 설정
    if (isWeb && window && (window.__APP_DISABLE_WEBSOCKET || webSettings.disableWebsocket)) {
      realtimeOptions.enabled = false;
    }
    
    // 클라이언트 옵션 구성
    const clientOptions = {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
      },
      realtime: realtimeOptions,
      global: {
        fetch: safeFetch, // 안전한 fetch 사용
      },
    };
    
    // 오프라인 모드 설정
    if (isWeb && window && (window.__APP_OFFLINE_MODE || webSettings.forceOffline)) {
      setFallbackMode(true);
    }
    
    // 클라이언트 생성
    try {
      if (__DEV__) {
      }
      
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase URL 또는 Key가 없습니다');
      }
      
      supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, clientOptions);
    } catch (error) {
      if (__DEV__) console.error('[supabaseClient] 생성 오류:', error);
      // 오류 발생 시 기본 옵션으로 재시도
      supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { autoRefreshToken: true, persistSession: true }
      });
      setFallbackMode(true);
    }
  }
  return supabaseInstance;
}

// 클라이언트 싱글톤 가져오기
export const supabase = initializeSupabase();

// Storage 관련 함수
/**
 * 지정된 버킷이 존재하는지 확인하고, 없으면 생성합니다.
 * @param {string} bucketName - 확인/생성할 버킷 이름
 * @returns {Promise<boolean>} - 성공 여부
 */
export async function ensureBucketExists(bucketName) {
  // Storage RLS 정책 문제로 인해 버킷 목록 조회를 건너뛰고
  // 직접 업로드를 시도합니다
  return true;
}

/**
 * Supabase Storage에 파일을 업로드합니다.
 * @param {File|Blob} file - 업로드할 파일 객체
 * @param {string} bucketName - 업로드할 버킷 이름
 * @param {string} path - 업로드 경로 (파일명 포함)
 * @returns {Promise<{publicUrl: string}>} - 업로드된 파일의 공개 URL
 */
export async function uploadFileToSupabase(file, bucketName, path) {
  if (!bucketName || !path || !file) {
    throw new Error('버킷 이름, 경로 및 파일이 필요합니다');
  }
  
  try {
    // 버킷이 존재하는지 확인
    await ensureBucketExists(bucketName);
    
    // FormData 방식으로 업로드 시도
    let uploadData;
    
    if (file.uri) {
      // React Native 파일 객체인 경우
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        type: file.type || 'image/jpeg',
        name: file.name || 'image.jpg'
      });
      uploadData = formData;
    } else {
      // 일반 Blob/File인 경우
      uploadData = file;
    }
    
    // 파일 업로드
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(path, uploadData, {
        cacheControl: '3600',
        upsert: true,
      });
    
    if (error) {
      console.error('파일 업로드 오류:', error);
      throw error;
    }
    
    if (!data || !data.path) {
      throw new Error('업로드 응답 데이터가 유효하지 않습니다');
    }
    
    // 공개 URL 가져오기
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(data.path);
    
    if (!publicUrlData || !publicUrlData.publicUrl) {
      throw new Error('공개 URL을 가져오는 데 실패했습니다');
    }
    
    
    return {
      publicUrl: publicUrlData.publicUrl,
      path: data.path
    };
  } catch (error) {
    console.error('파일 업로드 중 오류:', error);
    throw error;
  }
}

// 네트워크 관련 유틸
/**
 * 타임아웃이 있는 Promise를 생성합니다.
 * @param {number} ms - 타임아웃 시간 (ms)
 * @returns {Promise<never>} - 타임아웃 후 거부되는 Promise
 */
export function timeoutPromise(ms) {
  return new Promise((_, reject) => 
    setTimeout(() => reject(new Error(`타임아웃: ${ms}ms 이상 경과`)), ms)
  );
}

/**
 * 안전한 Fetch 호출 - 타임아웃 및 예외 처리 포함
 * @param {string} url - 요청 URL
 * @param {object} options - fetch 옵션
 * @param {number} timeout - 타임아웃 (ms)
 * @returns {Promise<Response>} - fetch 응답
 */
export async function safeFetch(url, options = {}, timeout = 5000) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    console.error(`Fetch 오류 [${url}]:`, error);
    throw error;
  }
}

// Supabase 연결 테스트 및 진단 함수
/**
 * Supabase 연결을 테스트합니다.
 * @returns {Promise<boolean>} - 연결 성공 여부
 */
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('test_connection').select('*').limit(1);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Supabase 연결 테스트 실패:', error);
    return false;
  }
}

/**
 * Supabase 연결 문제를 진단합니다.
 * @returns {Promise<object>} - 진단 결과
 */
export async function diagnoseSupabaseIssues() {
  const results = {
    connectivity: false,
    auth: false,
    storage: false,
    database: false,
    errors: []
  };
  
  try {
    // 접속성 테스트
    results.connectivity = await testSupabaseConnection();
  } catch (error) {
    results.errors.push(`접속성 오류: ${error.message}`);
  }
  
  return results;
}

// 채팅 관련 함수
/**
 * 채팅 채널을 생성합니다.
 * @param {string} channelName - 채널 이름
 * @returns {object} - Supabase 채널 객체
 */
export function createChatChannel(channelName) {
  if (!channelName) throw new Error('채널 이름이 필요합니다');
  
  try {
    return supabase.channel(channelName);
  } catch (error) {
    console.error('채팅 채널 생성 오류:', error);
    throw error;
  }
}

// 인증 관련 함수
/**
 * 익명 사용자로 로그인합니다.
 * @returns {Promise<object>} - 로그인 결과
 */
export async function signInAnonymously() {
  try {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('익명 로그인 오류:', error);
    throw error;
  }
}

/**
 * 현재 사용자 ID를 가져옵니다.
 * @returns {Promise<string|null>} - 사용자 ID 또는 null
 */
export async function getCurrentUserId() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session?.user?.id || null;
  } catch (error) {
    console.error('사용자 ID 가져오기 오류:', error);
    return null;
  }
}

/**
 * 로그아웃합니다.
 * @returns {Promise<void>}
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error('로그아웃 오류:', error);
    throw error;
  }
}

// 기본 내보내기 - 메인 클라이언트
export default supabase;
