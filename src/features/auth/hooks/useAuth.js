import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { supabase, logger } from '../../../shared';

/**
 * 인증 상태 관리 커스텀 훅
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(function() {
    let mounted = true;

    // 현재 세션 가져오기 (타임아웃 포함)
    async function getInitialSession() {
      
      // 10초 타임아웃 설정 (네트워크 상황 고려)
      const timeoutPromise = new Promise(function(_, reject) {
        return setTimeout(function() { reject(new Error('세션 로드 타임아웃')); }, 10000);
      });
      
      try {
        const sessionPromise = supabase.auth.getSession();
        const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise]);
        
        if (error) {
          console.error('[useAuth] 세션 가져오기 오류:', error);
          // API 키 오류 시 게스트 모드로 설정
          if (error.message.includes('Invalid API key')) {
            console.log('[useAuth] API 키 오류 - 게스트 모드');
          }
          // Error occurred, set to null state
          if (mounted) {
            setSession(null);
            setUser(null);
          }
        } else if (mounted) {
          setSession(session);
          
          // 세션이 있으면 프로필 정보 포함해서 user 설정
          if (session?.user) {
            try {
              await updateUserProfile(session.user);
            } catch (profileError) {
              console.error('[useAuth] 프로필 업데이트 실패:', profileError);
              // Still set basic user info even if profile update fails
              setUser(session.user);
            }
          } else {
            setUser(null);
          }
        }
      } catch (error) {
        console.error('[useAuth] 초기 세션 로드 오류:', error);
        
        // 타임아웃이나 오류 시 게스트 모드로 설정
        if (mounted) {
          setSession(null);
          setUser(null);
          console.log('[useAuth] 오류로 인한 게스트 모드 설정');
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
      async function(event, session) {
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
        
        // 로그인 성공 시 사용자 프로필 업데이트
        if (event === 'SIGNED_IN' && session?.user) {
          await updateUserProfile(session.user);
          
          // 프리미엄 상태는 user.user_profiles.is_premium에서 확인
          
          // 계정 삭제 예약 확인
          const deleteRequestedAt = session.user.user_metadata?.delete_requested_at;
          if (deleteRequestedAt) {
            await checkDeletionRequest({ 
              requested_at: deleteRequestedAt,
              scheduled_deletion_at: session.user.user_metadata?.scheduled_deletion_at 
            });
          }
        }
      }
    );

    return function() {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // 사용자 프로필 업데이트 또는 생성
  async function updateUserProfile(user) {
    try {
      // 기존 프로필 확인 (프리미엄 상태 보존을 위해)
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('is_premium, premium_expires_at')
        .eq('id', user.id)
        .single();

      // user_profiles 테이블에 사용자 정보 저장/업데이트 (프리미엄 상태 보존)
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          username: user.user_metadata?.username || user.email.split('@')[0],
          full_name: user.user_metadata?.full_name || user.user_metadata?.username,
          avatar_url: user.user_metadata?.avatar_url,
          // 프리미엄 상태는 건드리지 않음 (refreshUserProfile에서 관리)
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('[useAuth] 사용자 프로필 업데이트 오류:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        
        // 테이블이 없는 경우 무시
        if (error.code === '42P01') {
          return;
        }
        
        // RLS 오류인 경우 무시
        if (error.code === '42501' || error.message.includes('RLS')) {
          return;
        }
      } else {
        // 프로필 업데이트 성공 시 전역 user 상태에 반영
        const updatedUser = {
          ...user,
          user_profiles: data
        };
        setUser(updatedUser);
        
        logger.log('[useAuth] ✅ 프로필 업데이트 및 전역 상태 반영 완료:', {
          is_premium: data.is_premium,
          is_admin: data.is_admin
        });
      }
    } catch (error) {
      console.error('[useAuth] 프로필 업데이트 예외:', error);
    }
  };

  // 계정 삭제 요청 확인
  async function checkDeletionRequest(deletionRequest) {
    try {
      const now = new Date();
      const scheduledDeletionTime = new Date(deletionRequest.scheduled_deletion_at);
      
      if (now < scheduledDeletionTime) {
        // 아직 삭제 시간이 되지 않음 - 복구 옵션 제공
        Alert.alert(
          '계정 삭제 예약됨',
          `이 계정은 ${scheduledDeletionTime.toLocaleString()}에 삭제 예정입니다.\n\n계정 삭제를 취소하시겠습니까?`,
          [
            {
              text: '삭제 진행',
              style: 'destructive',
              onPress: async function() {
                await signOut();
              }
            },
            {
              text: '삭제 취소',
              style: 'default',
              onPress: async function() {
                await cancelAccountDeletion();
              }
            }
          ]
        );
      } else {
        // 삭제 시간이 지남 - 자동 삭제 진행 또는 알림
        Alert.alert(
          '계정 삭제 시간 경과',
          '계정 삭제 예정 시간이 지났습니다. 잠시 후 자동으로 로그아웃됩니다.',
          [{ text: '확인' }]
        );
        
        setTimeout(async function() {
          await signOut();
        }, 2000);
      }
    } catch (error) {
      console.error('[useAuth] 삭제 요청 확인 오류:', error);
    }
  };

  // 계정 삭제 취소
  async function cancelAccountDeletion() {
    try {
      const { error } = await supabase.auth.updateUser({
        data: { 
          delete_requested_at: null,
          scheduled_deletion_at: null,
          deletion_reason: null
        }
      });

      if (error) {
        Alert.alert('오류', '계정 삭제 취소 중 문제가 발생했습니다.');
        return;
      }

      Alert.alert(
        '계정 삭제 취소됨',
        '계정 삭제가 성공적으로 취소되었습니다.',
        [{ text: '확인' }]
      );
    } catch (error) {
      console.error('[useAuth] 삭제 취소 오류:', error);
      Alert.alert('오류', '계정 삭제 취소 중 문제가 발생했습니다.');
    }
  };

  // 로그인
  async function signIn(email, password) {
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
  async function signUp(email, password, username) {
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
  async function signOut() {
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


  // 프로필 새로고침 함수 (강화된 로직)
  async function refreshUserProfile() {
    try {
      logger.log('🔄 [프로필새로고침] 시작');
      
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        logger.warn('🔄 [프로필새로고침] 사용자 정보 없음');
        return { success: false, error: '사용자 정보 없음' };
      }
      
      logger.log('🔄 [프로필새로고침] 사용자 확인됨, 프로필 조회 중...');
      
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();
      
      if (error) {
        logger.error('🔄 [프로필새로고침] 프로필 조회 실패:', error);
        return { success: false, error };
      }
      
      if (!profile) {
        logger.warn('🔄 [프로필새로고침] 프로필 데이터 없음');
        return { success: false, error: '프로필 데이터 없음' };
      }
      
      // 프로필 정보를 user 객체에 병합
      const updatedUser = {
        ...currentUser,
        user_profiles: profile
      };
      
      logger.log('🔄 [프로필새로고침] 상태 업데이트 중...', {
        user_id: currentUser.id,
        is_premium: profile.is_premium,
        premium_expires_at: profile.premium_expires_at,
        username: profile.username
      });
      
      setUser(updatedUser);
      
      logger.log('🔄 [프로필새로고침] ✅ 완료! 프리미엄 상태:', profile.is_premium);
      return { success: true, profile };
      
    } catch (error) {
      logger.error('🔄 [프로필새로고침] 예외 발생:', error);
      return { success: false, error };
    }
  };

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    refreshUserProfile,
    isAuthenticated: !!user
  };
}