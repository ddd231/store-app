import { useState, useEffect, useRef, useCallback } from 'react';
import { AppState } from 'react-native';
import { supabase, useIsMounted } from '../../../shared';
import notificationService from '../../../services/notificationService';

export function useChatRealtime(roomId, currentUserRef, setMessages, markMessagesAsRead) {
  const [isConnected, setIsConnected] = useState(false);
  const [appState, setAppState] = useState(AppState.currentState);
  const [notificationSettings, setNotificationSettings] = useState(null);
  
  const isMounted = useIsMounted();
  const appStateRef = useRef(AppState.currentState);
  const notificationSettingsRef = useRef(null);
  const channelRef = useRef(null);

  // ref 값 업데이트
  useEffect(function() {
    notificationSettingsRef.current = notificationSettings;
  }, [notificationSettings]);

  // 앱 상태 감지
  useEffect(function() {
    const subscription = AppState.addEventListener('change', function(nextAppState) {
      appStateRef.current = nextAppState;
      setAppState(nextAppState);
    });

    return function() {
      subscription?.remove();
    };
  }, []);

  // 알림 설정 로드
  useEffect(function() {
    if (currentUserRef.current?.id) {
      loadNotificationSettings();
    }
  }, []);

  // 실시간 구독 설정
  useEffect(function() {
    if (!roomId) return;

    console.log('[ChatRealtime] useEffect - roomId 변경:', roomId);
    console.log('[ChatRealtime] useEffect - currentUser:', currentUserRef.current?.id);
    
    // 이전 채널이 있다면 정리
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    
    // Supabase v2 패턴: 새 채널 생성하고 ref에 저장
    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`
        },
        handleNewMessage
      )
      .subscribe(function(status) {
        if (isMounted()) {
          setIsConnected(status === 'SUBSCRIBED');
        }
      });
    
    channelRef.current = channel;
    
    // Cleanup - 채널 제거 및 ref 정리
    return function() {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [roomId, isMounted]);

  const handleNewMessage = useCallback(async function(payload) {
    if (!isMounted()) return;
    
    const newMessage = payload.new;
    
    // 함수형 업데이트로 stale closure 방지
    setMessages(function(prev) { return [...prev, newMessage]; });
    
    markMessagesAsRead();
    
    // 알림 발송 (백그라운드이고, 다른 사용자의 메시지이고, 알림이 켜져있을 때)
    if (appStateRef.current === 'background' && 
        newMessage.sender_id !== currentUserRef.current?.id &&
        notificationSettingsRef.current?.push_notifications_enabled) {
      try {
        await notificationService.sendMessageNotification(
          newMessage.sender_name || '알 수 없는 사용자',
          newMessage.content || '새 메시지',
          roomId
        );
      } catch (error) {
        console.error('알림 전송 실패:', error);
      }
    }
  }, [isMounted, setMessages, markMessagesAsRead, roomId]);

  async function loadNotificationSettings() {
    if (!currentUserRef.current?.id) return;
    const settings = await notificationService.getNotificationSettings(currentUserRef.current.id);
    setNotificationSettings(settings);
  }

  return {
    isConnected,
    appState,
    notificationSettings,
    loadNotificationSettings
  };
}