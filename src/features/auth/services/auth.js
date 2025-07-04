// Supabase 인증 관련 모듈
import { supabase } from '../../../shared';

/**
 * 익명 로그인 기능 비활성화
 * 프로덕션에서는 적절한 인증이 필요
 * @returns {Promise<Object>} 로그인 결과
 */
export async function signInAnonymously() {
  return {
    data: null,
    error: new Error('익명 로그인은 프로덕션에서 지원되지 않습니다. 적절한 계정으로 로그인해주세요.')
  };
};

/**
 * 현재 사용자 ID 가져오기
 * @returns {string|null} 사용자 ID 또는 null
 */
export async function getCurrentUserId() {
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
export async function signOut() {
  try {
    return await supabase.auth.signOut();
  } catch (error) {
    console.error('[인증] 로그아웃 실패:', error);
    return { error };
  }
};

export default {
  getCurrentUserId,
  signOut
};
