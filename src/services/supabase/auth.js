// Supabase 인증 관련 모듈
import { supabase } from './client';
import { isInFallbackMode } from './config';

/**
 * 익명 로그인 함수
 * @returns {Promise<Object>} 로그인 결과
 */
export const signInAnonymously = async () => {
  
  try {
    // 세션이 이미 있는지 확인
    const { data: sessionData } = await supabase.auth.getSession();
    
    // 세션이 이미 존재하면 재사용
    if (sessionData?.session) {
      return {
        error: null,
        data: {
          session: sessionData.session,
          user: sessionData.session.user
        }
      };
    }
    
    // 익명 로그인 시도
    const { data, error } = await supabase.auth.signUp({
      email: `${Date.now()}@anonymous.user`,
      password: `anon_${Math.random().toString(36).substring(2, 15)}`,
    });
    
    if (error) {
      console.error('[인증] 익명 로그인 실패:', error);
      throw error;
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('[인증] 익명 로그인 처리 중 오류:', error);
    
    // 폴백 모드에서는 모의 인증 데이터 반환
    if (isInFallbackMode()) {
      
      const mockUser = {
        id: `anon_${Math.random().toString(36).substring(2, 10)}`,
        email: null,
        role: 'anonymous',
        aud: 'authenticated',
        created_at: new Date().toISOString()
      };
      
      const mockSession = {
        access_token: `mock_token_${Date.now()}`,
        refresh_token: `mock_refresh_${Date.now()}`,
        expires_at: Date.now() + 3600 * 1000, // 1시간 후 만료
        user: mockUser
      };
      
      return {
        error: null,
        data: {
          user: mockUser,
          session: mockSession
        }
      };
    }
    
    return { data: null, error };
  }
};

/**
 * 현재 사용자 ID 가져오기
 * @returns {string|null} 사용자 ID 또는 null
 */
export const getCurrentUserId = async () => {
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session?.user?.id || null;
  } catch (error) {
    console.error('[인증] 사용자 ID 조회 실패:', error);
    return null;
  }
};

/**
 * 로그아웃 함수
 * @returns {Promise<Object>} 로그아웃 결과
 */
export const signOut = async () => {
  try {
    return await supabase.auth.signOut();
  } catch (error) {
    console.error('[인증] 로그아웃 실패:', error);
    return { error };
  }
};

export default {
  signInAnonymously,
  getCurrentUserId,
  signOut
};
