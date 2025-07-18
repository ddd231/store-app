import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../shared';

export function useChatAuth() {
  const [currentUser, setCurrentUser] = useState(null);
  const [username, setUsername] = useState('User' + Math.floor(Math.random() * 1000));
  const currentUserRef = useRef(null);

  useEffect(function() {
    loadUser();
  }, []);

  useEffect(function() {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  async function loadUser() {
    try {
      console.log('[ChatAuth] loadUser 시작');
      const { data: { user }, error } = await supabase.auth.getUser();
      console.log('[ChatAuth] Supabase getUser 결과:', { user, error });
      
      if (user && !error) {
        setCurrentUser(user);
        console.log('[ChatAuth] currentUser 설정 완료:', user.id);
        
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('username')
          .eq('id', user.id)
          .single();
          
        console.log('[ChatAuth] 프로필 조회 결과:', { profile, profileError });
        
        if (profile?.username) {
          setUsername(profile.username);
          console.log('[ChatAuth] username 설정:', profile.username);
        } else {
          console.log('[ChatAuth] 프로필에서 username 없음, 기본값 사용');
        }
      } else {
        console.log('[ChatAuth] 사용자 정보 없음 또는 오류:', error);
        setCurrentUser(null);
      }
    } catch (err) {
      console.error('[ChatAuth] loadUser 오류:', err);
      setCurrentUser(null);
    }
  }

  return {
    currentUser,
    username,
    currentUserRef,
    loadUser
  };
}