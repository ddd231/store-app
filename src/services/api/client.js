/**
 * 통합 Supabase 클라이언트
 * 모든 Supabase 관련 작업을 위한 싱글톤 인스턴스
 */

import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// 환경 변수에서 설정 가져오기
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://zudnmkyedvhdgftbwatt.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1ZG5ta3llZHZoZGdmdGJ3YXR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0OTc5NjYsImV4cCI6MjA2MzA3Mzk2Nn0.FwQ2yqazywF3bGSN7N0I27ZC_nas32J6tKCoGeC3eeQ';

// 플랫폼별 설정
const isWeb = Platform.OS === 'web';

// 싱글톤 인스턴스
let supabaseInstance = null;

/**
 * Supabase 클라이언트 생성 또는 반환
 */
function getSupabaseClient() {
  if (!supabaseInstance) {
    const options = {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: isWeb,
        storage: isWeb ? window.localStorage : undefined,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
      global: {
        headers: {
          'x-app-version': '1.0.0',
        },
      },
    };

    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, options);
    
    if (__DEV__) {
        url: supabaseUrl,
        platform: Platform.OS,
      });
    }
  }

  return supabaseInstance;
}

// 내보내기
export const supabase = getSupabaseClient();
export { supabaseUrl, supabaseAnonKey };

// 헬퍼 함수들
export const auth = supabase.auth;
export const storage = supabase.storage;
export const realtime = supabase.realtime;

/**
 * 현재 사용자 가져오기
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('[Supabase] Get user error:', error);
    return null;
  }
  return user;
}

/**
 * 파일 업로드 URL 생성
 */
export function getStorageUrl(bucket, path) {
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

/**
 * Private 파일 URL 생성
 */
export async function getSignedUrl(bucket, path, expiresIn = 3600) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);
    
  if (error) {
    console.error('[Supabase] Signed URL error:', error);
    return null;
  }
  
  return data.signedUrl;
}

export default supabase;