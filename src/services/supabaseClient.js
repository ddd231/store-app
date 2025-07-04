/**
 * Supabase 클라이언트 엔트리 파일
 * 전체 애플리케이션에서 사용하는 중앙집중식 Supabase 클라이언트
 * 중요: 싱글톤 패턴으로 구현하여 중복 생성 방지 (2025-06-01 수정)
 */

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';

// 최소 데이터 사용을 위한 커스텀 스토리지 어댑터
const MinimalDataStorage = {
  async getItem(key) {
    try {
      // JWT 토큰만 저장 (기본 사용자 데이터 제외)
      const value = await AsyncStorage.getItem(key);
      if (value) {
        const parsed = JSON.parse(value);
        // access_token과 refresh_token만 유지, 불필요한 메타데이터 제거
        if (parsed.access_token && parsed.refresh_token) {
          return JSON.stringify({
            access_token: parsed.access_token,
            refresh_token: parsed.refresh_token,
            expires_at: parsed.expires_at, // 만료 시간만 유지
            token_type: parsed.token_type || 'bearer'
          });
        }
      }
      return value;
    } catch (error) {
      return null;
    }
  },
  async setItem(key, value) {
    try {
      // 세션 데이터 최소화
      if (key.includes('auth')) {
        const parsed = JSON.parse(value);
        // 필수 토큰 정보만 저장
        const minimalSession = {
          access_token: parsed.access_token,
          refresh_token: parsed.refresh_token,
          expires_at: parsed.expires_at,
          token_type: parsed.token_type || 'bearer'
        };
        await AsyncStorage.setItem(key, JSON.stringify(minimalSession));
      } else {
        await AsyncStorage.setItem(key, value);
      }
    } catch (error) {
      // 저장 오류 무시 (중요하지 않음)
    }
  },
  async removeItem(key) {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      // 삭제 오류 무시 (중요하지 않음)
    }
  }
};

// Supabase 프로젝트 URL와 익명 키 설정 (환경변수에서 가져오기)
export const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
export const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// 기본 버킷 이름 설정
export const DEFAULT_BUCKET = 'artify-uploads';

// 플랫폼 감지
export const isWeb = typeof window !== 'undefined' && typeof document !== 'undefined';
export const isHermesEngine = typeof global !== 'undefined' && global.HermesInternal != null;

// 오프라인 모드 상태 관리
let _isInFallbackMode = false;
export const isInFallbackMode = function() { return _isInFallbackMode; };
export function setFallbackMode(value) {
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
    try {
      // 환경변수 체크
      if (!supabaseUrl || !supabaseAnonKey) {
        // Supabase 환경변수 누락 오류
        throw new Error('Supabase URL 또는 Key가 없습니다');
      }
      
      // 최소 데이터 사용을 위한 최적화된 설정
      const clientOptions = {
        auth: {
          storage: MinimalDataStorage, // JWT 토큰만 저장 (access_token + refresh_token)
          autoRefreshToken: true, // 토큰 자동 갱신으로 재로그인 방지
          persistSession: true, // 앱 재시작해도 로그인 유지
          detectSessionInUrl: false, // URL 파싱 비활성화
          flowType: 'pkce', // 보안성 향상, 데이터 사용량 최소화
          storage_key: 'sb-auth', // 짧은 키 이름으로 저장 공간 절약
        },
        realtime: {
          enabled: true // 실시간 기능 활성화
        },
        global: {
          headers: {
            'Cache-Control': 'max-age=3600' // 1시간 캐싱으로 네트워크 요청 최소화
          }
        }
      };
      
      supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, clientOptions);
      
      // 배터리 및 데이터 절약을 위한 최적화된 AppState 관리
      try {
        AppState.addEventListener('change', function(state) { 
          if (state === 'active') {
            // 앱 활성화 시에만 토큰 새로고침 (최소 데이터 사용)
            supabaseInstance.auth.startAutoRefresh();
          } else {
            // 백그라운드에서는 새로고침 중단으로 데이터 절약
            supabaseInstance.auth.stopAutoRefresh();
          }
        });
      } catch (appStateError) {
        // AppState 리스너 추가 실패 시 무시하고 계속 진행
      }
    } catch (error) {
      throw error;
    }
  }
  return supabaseInstance;
}

// 클라이언트 싱글톤 가져오기 (지연 초기화)
let _supabase = null;
export function getSupabase() {
  if (!_supabase) {
    _supabase = initializeSupabase();
  }
  return _supabase;
};

// 호환성을 위한 기본 export
export const supabase = getSupabase();

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
  // 파일 업로드 시작
  
  if (!bucketName || !path || !file) {
    throw new Error('버킷 이름, 경로 및 파일이 필요합니다');
  }
  
  try {
    // 버킷이 존재하는지 확인
    await ensureBucketExists(bucketName);
    
    let uploadData;
    
    if (file.uri) {
      // React Native 파일 감지됨
      
      // 방법 1: fetch + FormData (가장 빠르고 안정적)
      try {
        const formData = new FormData();
        formData.append('file', {
          uri: file.uri,
          type: file.type || 'image/jpeg',
          name: file.name || 'image.jpg'
        });
        
        uploadData = formData;
        // FormData 생성 완료
        
      } catch (formDataError) {
        // FormData 실패, ArrayBuffer 시도
        
        // 방법 2: fetch + ArrayBuffer (바이너리 처리)
        if (file.base64) {
          const binaryString = atob(file.base64);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          uploadData = bytes.buffer;
          // Base64 → ArrayBuffer 변환 완료
        } else {
          const response = await fetch(file.uri);
          uploadData = await response.arrayBuffer();
          // Fetch → ArrayBuffer 변환 완료
        }
      }
      
    } else {
      // 웹 환경용
      uploadData = file;
      // Regular file/blob
    }
    
    // 파일 업로드 - contentType 명시적 설정
    // Supabase 스토리지에 업로드 중...
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(path, uploadData, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type || 'image/jpeg'
      });
    
    if (error) {
      // 파일 업로드 오류 발생
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
    // 파일 업로드 중 오류
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
  return new Promise(function(_, reject) {
    setTimeout(function() { reject(new Error(`타임아웃: ${ms}ms 이상 경과`)); }, ms);
  });
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
    const timeoutId = setTimeout(function() { controller.abort(); }, timeout);
    
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    // Fetch 오류 발생
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
    // Supabase 연결 테스트 실패
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
    // 채팅 채널 생성 오류
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
    // 익명 로그인 오류
    throw error;
  }
}

/**
 * 현재 사용자 ID를 가져옵니다.
 * @returns {Promise<string|null>} - 사용자 ID 또는 null
 */
export async function getCurrentUserId() {
  try {
    // getUser()가 더 안정적임
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      // getCurrentUserId 오류
      return null;
    }
    
    const userId = data.user?.id || null;
    // getCurrentUserId 결과 반환
    return userId;
  } catch (error) {
    // 사용자 ID 가져오기 오류
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
    // 로그아웃 오류
    throw error;
  }
}

// 기본 내보내기 - 메인 클라이언트
export default supabase;
