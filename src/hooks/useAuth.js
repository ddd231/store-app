import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

/**
 * 인증 상태 관리 커스텀 훅
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // 현재 세션 가져오기 (타임아웃 포함)
    async function getInitialSession() {
      
      // 5초 타임아웃 설정
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('세션 로드 타임아웃')), 5000)
      );
      
      try {
        const sessionPromise = supabase.auth.getSession();
        const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise]);
        
        if (__DEV__) {
        }
        
        if (error) {
          console.error('[useAuth] 세션 가져오기 오류:', error);
          // API 키 오류 시 게스트 모드로 설정
          if (error.message.includes('Invalid API key')) {
          }
        } else if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('[useAuth] 초기 세션 로드 오류:', error);
        
        // 타임아웃이나 오류 시 로딩 강제 종료
        if (error.message.includes('타임아웃')) {
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    getInitialSession();

    // 인증 상태 변경 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
        
        // 로그인 성공 시 사용자 프로필 업데이트
        if (event === 'SIGNED_IN' && session?.user) {
          await updateUserProfile(session.user);
        }
      }
    );

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // 사용자 프로필 업데이트 또는 생성
  const updateUserProfile = async (user) => {
    try {
      // user_profiles 테이블에 사용자 정보 저장/업데이트
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          email: user.email,
          username: user.user_metadata?.username || user.email.split('@')[0],
          full_name: user.user_metadata?.full_name || user.user_metadata?.username,
          avatar_url: user.user_metadata?.avatar_url,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        if (__DEV__) {
          console.error('[useAuth] 사용자 프로필 업데이트 오류:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          });
        }
        
        // 테이블이 없는 경우 무시
        if (error.code === '42P01') {
          return;
        }
        
        // RLS 오류인 경우 무시
        if (error.code === '42501' || error.message.includes('RLS')) {
          return;
        }
      } else {
      }
    } catch (error) {
      console.error('[useAuth] 프로필 업데이트 예외:', error);
    }
  };

  // 로그인
  const signIn = async (email, password) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('[useAuth] 로그인 오류:', error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  // 회원가입
  const signUp = async (email, password, username) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            full_name: username,
          }
        }
      });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('[useAuth] 회원가입 오류:', error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  // 로그아웃
  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('[useAuth] 로그아웃 오류:', error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  // 게스트 로그인
  const signInAsGuest = () => {
    const guestUser = {
      id: 'guest_' + Date.now(),
      email: 'guest@example.com',
      user_metadata: {
        username: 'Guest' + Math.floor(Math.random() * 1000),
        full_name: 'Guest User'
      }
    };
    
    setUser(guestUser);
    setSession({ user: guestUser });
    setLoading(false);
    
    return { success: true, user: guestUser };
  };

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    signInAsGuest,
    isAuthenticated: !!user,
    isGuest: user?.id?.startsWith('guest_')
  };
}