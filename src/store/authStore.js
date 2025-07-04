import { create } from 'zustand';
import { supabase, logger } from '../shared';

export const useAuthStore = create(function(set, get) { return {
  // State
  user: null,
  session: null,
  loading: true,
  isAuthenticated: false,

  // Actions
  setUser: function(user) { return set({ 
    user, 
    isAuthenticated: !!user 
  }); },

  setSession: function(session) { return set({ 
    session,
    user: session?.user || null,
    isAuthenticated: !!session?.user
  }); },

  setLoading: function(loading) { return set({ loading }); },

  // 사용자 프로필 업데이트 또는 생성
  updateUserProfile: async function(user) {
    try {
      // user_profiles 테이블에 사용자 정보 저장/업데이트
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          username: user.user_metadata?.username || user.email.split('@')[0],
          full_name: user.user_metadata?.full_name || user.user_metadata?.username,
          avatar_url: user.user_metadata?.avatar_url,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        logger.error('사용자 프로필 업데이트 오류:', error);
        return;
      }

      // 프로필 업데이트 성공 시 전역 user 상태에 반영
      const updatedUser = {
        ...user,
        user_profiles: data
      };
      
      set({ user: updatedUser });
      logger.info('프로필 업데이트 및 전역 상태 반영 완료');
    } catch (error) {
      logger.error('프로필 업데이트 예외:', error);
    }
  },

  // 프로필 새로고침 함수
  refreshUserProfile: async function() {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single();
        
        if (error) {
          logger.error('프로필 새로고침 실패:', error);
          return { success: false, error };
        }

        // 프로필 정보를 user 객체에 병합
        const updatedUser = {
          ...currentUser,
          user_profiles: profile
        };
        
        set({ user: updatedUser });
        logger.info('프로필 새로고침 완료');
        return { success: true, profile };
      }
      return { success: false, error: '사용자 정보 없음' };
    } catch (error) {
      logger.error('프로필 새로고침 오류:', error);
      return { success: false, error };
    }
  },

  // 로그인
  signIn: async function(email, password) {
    set({ loading: true });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      logger.error('로그인 오류:', error);
      return { success: false, error };
    } finally {
      set({ loading: false });
    }
  },

  // 회원가입
  signUp: async function(email, password, username) {
    set({ loading: true });
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
      logger.error('회원가입 오류:', error);
      return { success: false, error };
    } finally {
      set({ loading: false });
    }
  },

  // 로그아웃
  signOut: async function() {
    set({ loading: true });
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      set({ 
        user: null, 
        session: null, 
        isAuthenticated: false 
      });
      
      return { success: true };
    } catch (error) {
      logger.error('로그아웃 오류:', error);
      return { success: false, error };
    } finally {
      set({ loading: false });
    }
  },

  // 초기화
  initialize: async function() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        logger.error('세션 가져오기 오류:', error);
      } else {
        set({ 
          session,
          user: session?.user || null,
          isAuthenticated: !!session?.user
        });
        
        // 세션이 있으면 프로필 정보 업데이트
        if (session?.user) {
          await get().updateUserProfile(session.user);
        }
      }
    } catch (error) {
      logger.error('초기화 오류:', error);
    } finally {
      set({ loading: false });
    }
  },

  // 인증 상태 변경 리스너 설정
  setupAuthListener: function() {
    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async function(event, session) {
          set({ 
            session,
            user: session?.user || null,
            isAuthenticated: !!session?.user,
            loading: false
          });
          
          // 로그인 성공 시 사용자 프로필 업데이트
          if (event === 'SIGNED_IN' && session?.user) {
            await get().updateUserProfile(session.user);
          }
        }
      );

      return subscription;
    } catch (error) {
      logger.error('Auth listener 설정 오류:', error);
      return null;
    }
  },
}; });