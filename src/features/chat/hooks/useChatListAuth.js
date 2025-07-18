import { useState, useEffect } from 'react';
import { supabase } from '../../../shared';

export function useChatListAuth() {
  const [user, setUser] = useState(null);

  useEffect(function() {
    async function getCurrentUser() {
      try {
        const { data: { user: currentUser }, error } = await supabase.auth.getUser();
        console.log('[ChatListScreen] Supabase getUser 결과:', { user: currentUser, error });
        
        if (currentUser && !error) {
          setUser(currentUser);
        } else {
          console.log('[ChatListScreen] 사용자 정보 없음 또는 오류:', error);
          setUser(null);
        }
      } catch (err) {
        console.error('[ChatListScreen] 사용자 정보 가져오기 오류:', err);
        setUser(null);
      }
    }
    
    getCurrentUser();
  }, []);

  return { user };
}