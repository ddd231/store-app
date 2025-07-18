import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../shared';

export function useChatRoomsList(user) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastMessages, setLastMessages] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});

  const loadLastMessage = useCallback(async function(roomId) {
    try {
      const { data: lastMessage, error } = await supabase
        .from('messages')
        .select('content, created_at, sender_name')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!error && lastMessage) {
        setLastMessages(function(prev) { 
          return { ...prev, [roomId]: lastMessage }; 
        });
      }
    } catch (error) {
      console.error('[ChatListScreen] 마지막 메시지 로드 오류:', error);
    }
  }, []);

  const loadUnreadCount = useCallback(async function(roomId) {
    if (!user?.id) return;

    try {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', roomId)
        .eq('is_read', false)
        .neq('sender_id', user.id);

      if (!error) {
        setUnreadCounts(function(prev) { 
          return { ...prev, [roomId]: count || 0 }; 
        });
      }
    } catch (error) {
      console.error('[ChatListScreen] 읽지 않은 메시지 수 로드 오류:', error);
    }
  }, [user]);

  const loadChatRooms = useCallback(async function() {
    try {
      console.log('[ChatListScreen] 채팅방 로드 시작');
      setLoading(true);

      if (!user || !user.id) {
        console.log('[ChatListScreen] 사용자 정보 없음');
        setChats([]);
        setLoading(false);
        return;
      }

      // 사용자가 참여한 채팅방 조회
      const { data: participantRooms, error: participantError } = await supabase
        .from('chat_participants')
        .select(`
          room_id,
          chat_rooms!inner (
            id,
            name,
            creator_id,
            participant_id,
            is_private,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', user.id);

      console.log('[ChatListScreen] 참여 채팅방 조회 결과:', { participantRooms, participantError });

      if (participantError) {
        console.error('[ChatListScreen] 채팅방 로드 오류:', participantError);
        setChats([]);
        setLoading(false);
        return;
      }

      // 채팅방 데이터 추출
      const rooms = participantRooms?.map(function(item) { return item.chat_rooms; }) || [];
      console.log('[ChatListScreen] 채팅방 목록:', rooms);

      setChats(rooms);

      // 각 채팅방의 마지막 메시지와 읽지 않은 메시지 수 조회
      await Promise.all(rooms.map(async function(room) {
        await loadLastMessage(room.id);
        await loadUnreadCount(room.id);
      }));

    } catch (error) {
      console.error('[ChatListScreen] 채팅방 로드 예외:', error);
      setChats([]);
    } finally {
      setLoading(false);
    }
  }, [user, loadLastMessage, loadUnreadCount]);

  useEffect(function() {
    console.log('[ChatListScreen] user 변경:', user);
    if (user && user.id) {
      loadChatRooms();
    }
  }, [user, loadChatRooms]);

  const leaveRoom = useCallback(async function(roomId) {
    try {
      // 참여자 테이블에서 현재 사용자 제거
      const { error } = await supabase
        .from('chat_participants')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', user?.id);

      if (!error) {
        // 로컬 상태에서 채팅방 제거
        setChats(function(prev) { 
          return prev.filter(function(chat) { return chat.id !== roomId; }); 
        });
        console.log('[ChatListScreen] 채팅방 나가기 완료:', roomId);
      } else {
        console.error('[ChatListScreen] 채팅방 나가기 오류:', error);
      }
    } catch (error) {
      console.error('[ChatListScreen] 채팅방 나가기 예외:', error);
    }
  }, [user]);

  const renameRoom = useCallback(async function(roomId, newName) {
    try {
      const { error } = await supabase
        .from('chat_rooms')
        .update({ name: newName })
        .eq('id', roomId);

      if (!error) {
        setChats(function(prev) { 
          return prev.map(function(chat) {
            return chat.id === roomId ? { ...chat, name: newName } : chat;
          }); 
        });
        console.log('[ChatListScreen] 채팅방 이름 변경 완료:', roomId, newName);
      } else {
        console.error('[ChatListScreen] 채팅방 이름 변경 오류:', error);
      }
    } catch (error) {
      console.error('[ChatListScreen] 채팅방 이름 변경 예외:', error);
    }
  }, []);

  return {
    chats,
    loading,
    lastMessages,
    unreadCounts,
    loadChatRooms,
    leaveRoom,
    renameRoom
  };
}