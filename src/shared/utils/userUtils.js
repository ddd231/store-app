/**
 * 사용자 관련 유틸리티 함수들
 * 중복 코드 제거 및 일관된 사용자 데이터 처리
 */

import { supabase } from '../services/supabase/client';

/**
 * 현재 로그인한 사용자 정보 가져오기 (프로필 포함)
 */
export async function getCurrentUserWithProfile() {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { user: null, profile: null, error: userError };
    }

    // 사용자 프로필 정보 가져오기
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return {
      user: {
        ...user,
        user_profiles: profile // useAuth와 동일한 구조
      },
      profile,
      error: profileError
    };
  } catch (error) {
    console.error('사용자 정보 로드 오류:', error);
    return { user: null, profile: null, error };
  }
};

/**
 * 기본 사용자 정보만 가져오기 (빠른 로딩용)
 */
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  } catch (error) {
    console.error('사용자 정보 로드 오류:', error);
    return { user: null, error };
  }
};

/**
 * 사용자 프로필 업데이트
 */
export async function updateUserProfile(userId, updates) {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    return { data, error };
  } catch (error) {
    console.error('사용자 프로필 업데이트 오류:', error);
    return { data: null, error };
  }
};

/**
 * 사용자 세션 확인
 */
export async function checkUserSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  } catch (error) {
    console.error('세션 확인 오류:', error);
    return { session: null, error };
  }
};