import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, useIsMounted } from '../../../shared';

export function useChatMessages(roomId, currentUser) {
  const [messages, setMessages] = useState([]);
  const isMounted = useIsMounted();
  const flatListRef = useRef(null);

  useEffect(function() {
    if (roomId) {
      loadMessages();
      if (currentUser) {
        markMessagesAsRead();
      }
    }
  }, [roomId, currentUser]);

  const loadMessages = useCallback(async function() {
    try {
      console.log('[ChatMessages] 메시지 로드 시작, roomId:', roomId);
      
      const messagesPromise = supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(50);
      
      const timeoutPromise = new Promise(function(_, reject) {
        setTimeout(function() {
          reject(new Error('메시지 로드 타임아웃'));
        }, 10000);
      });

      const { data, error } = await Promise.race([messagesPromise, timeoutPromise]);
      
      console.log('[ChatMessages] 메시지 쿼리 결과:', { 
        data: data ? `${data.length}개 메시지` : null, 
        error,
        roomId 
      });
      
      if (error) {
        console.error('[ChatMessages] 메시지 로드 오류:', error);
        if (isMounted()) {
          setMessages([]);
        }
        return;
      }
      
      if (isMounted()) {
        console.log('[ChatMessages] 메시지 state 업데이트:', data?.length || 0, '개');
        setMessages(data || []);
        setTimeout(function() {
          if (isMounted() && flatListRef.current) {
            flatListRef.current.scrollToEnd({ animated: false });
          }
        }, 100);
      }
    } catch (error) {
      console.error('[ChatMessages] 메시지 로드 예외:', error);
      if (isMounted()) {
        setMessages([]);
      }
    }
  }, [roomId, isMounted]);

  const markMessagesAsRead = useCallback(async function() {
    if (!currentUser || !roomId) return;
    
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('room_id', roomId)
      .neq('sender_id', currentUser.id);
  }, [currentUser, roomId]);

  const scrollToEnd = useCallback(function(animated = true) {
    setTimeout(function() {
      if (isMounted() && flatListRef.current) {
        flatListRef.current.scrollToEnd({ animated });
      }
    }, 100);
  }, [isMounted]);

  return {
    messages,
    setMessages,
    loadMessages,
    markMessagesAsRead,
    flatListRef,
    scrollToEnd
  };
}