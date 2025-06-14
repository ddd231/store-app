import { supabase, createChatChannel } from './supabaseClient';

/**
 * 채팅방 생성
 * @param {string} name - 채팅방 이름
 * @param {Array<string>} participantIds - 참여자 ID 배열 (현재 사용자 제외)
 * @returns {Promise<Object>} - 생성된 채팅방 정보
 */
export const createChatRoom = async (name, participantIds = []) => {
  try {
    // 현재 사용자 세션 확인
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      throw new Error('로그인이 필요합니다.');
    }
    
    const userId = sessionData.session.user.id;
    const userName = sessionData.session.user.user_metadata?.name || '사용자';
    
    // 채팅방 생성
    const { data: roomData, error: roomError } = await supabase
      .from('chat_rooms')
      .insert({
        name,
        creator_id: userId,
        updated_at: new Date().toISOString(),
        participants: JSON.stringify([userId, ...participantIds])
      })
      .select()
      .single();
    
    if (roomError) throw roomError;
    
    // 현재 사용자를 참여자로 추가
    const { error: selfParticipantError } = await supabase
      .from('room_participants')
      .insert({
        room_id: roomData.id,
        user_id: userId
      });
    
    if (selfParticipantError) throw selfParticipantError;
    
    // 다른 참여자들 추가
    if (participantIds.length > 0) {
      const participantRecords = participantIds.map(participantId => ({
        room_id: roomData.id,
        user_id: participantId
      }));
      
      const { error: participantError } = await supabase
        .from('room_participants')
        .insert(participantRecords);
      
      if (participantError) throw participantError;
    }
    
    // 첫 메시지 전송 (방 생성 알림)
    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        room_id: roomData.id,
        sender_id: userId,
        sender_name: userName,
        content: '채팅방이 생성되었습니다.'
      });
    
    if (messageError) throw messageError;
    
    return { success: true, room: roomData };
  } catch (error) {
    if (__DEV__) console.error('채팅방 생성 오류:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 사용자의 채팅방 목록 가져오기
 * @returns {Promise<Object>} - 채팅방 목록
 */
export const getChatRooms = async () => {
  try {
    // 게스트 모드일 때는 기본 채팅방 반환
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      return {
        success: true,
        rooms: [
          { id: 'general', name: '일반 채팅방', lastMessage: '환영합니다!', unread_count: 0 },
          { id: 'tech', name: '기술 토론방', lastMessage: '새로운 React 기능이...', unread_count: 0 },
          { id: 'art', name: '예술 작품방', lastMessage: '오늘의 작품을 공유합니다', unread_count: 0 },
        ]
      };
    }
    
    const userId = sessionData.session.user.id;
    
    // 사용자가 참여 중인 채팅방 ID 가져오기
    const { data: participantData, error: participantError } = await supabase
      .from('room_participants')
      .select('room_id')
      .eq('user_id', userId);
    
    if (participantError) throw participantError;
    
    if (!participantData || participantData.length === 0) {
      return { success: true, rooms: [] };
    }
    
    const roomIds = participantData.map(p => p.room_id);
    
    // 채팅방 정보 가져오기
    const { data: roomsData, error: roomsError } = await supabase
      .from('chat_rooms')
      .select('*')
      .in('id', roomIds)
      .order('updated_at', { ascending: false });
    
    if (roomsError) throw roomsError;
    
    // 각 채팅방의 안 읽은 메시지 수 계산 (오류 처리 추가)
    const roomsWithUnreadCount = await Promise.all(roomsData.map(async (room) => {
      try {
        // 마지막으로 읽은 시간 가져오기 (컬럼이 없을 수 있음)
        const { data: lastReadData, error: lastReadError } = await supabase
          .from('room_participants')
          .select('last_read')
          .eq('room_id', room.id)
          .eq('user_id', userId)
          .single();
        
        // last_read 컬럼이 없는 경우 기본값 사용
        if (lastReadError && lastReadError.code === '42703') {
          console.warn('last_read 컬럼이 없습니다. 기본값 사용');
          return { ...room, unread_count: 0 };
        }
        
        const lastReadTime = lastReadData?.last_read || new Date(0).toISOString();
        
        // 안 읽은 메시지 수 계산
        const { data: unreadData, error: unreadError } = await supabase
          .from('messages')
          .select('id', { count: 'exact' })
          .eq('room_id', room.id)
          .gt('created_at', lastReadTime)
          .neq('sender_id', userId);
        
        if (unreadError) {
          console.warn('읽지 않은 메시지 수 가져오기 오류:', unreadError);
          return { ...room, unread_count: 0 };
        }
        
        return {
          ...room,
          unread_count: unreadData.length || 0
        };
      } catch (error) {
        console.warn(`채팅방 ${room.id} 읽지 않은 메시지 계산 오류:`, error);
        return { ...room, unread_count: 0 };
      }
    }));
    
    return { success: true, rooms: roomsWithUnreadCount };
  } catch (error) {
    if (__DEV__) console.error('채팅방 목록 가져오기 오류:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 채팅방의 메시지 목록 가져오기
 * @param {string} roomId - 채팅방 ID
 * @param {number} limit - 가져올 메시지 수 (기본값: 50)
 * @param {number} page - 페이지 번호 (기본값: 0)
 * @returns {Promise<Object>} - 메시지 목록
 */
export const getMessages = async (roomId, limit = 50, page = 0) => {
  try {
    if (!roomId) {
      throw new Error('채팅방 ID가 필요합니다.');
    }
    
    // 현재 사용자 세션 확인
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      throw new Error('로그인이 필요합니다.');
    }
    
    const userId = sessionData.session.user.id;
    
    // 메시지 목록 가져오기
    const { data: messagesData, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .range(page * limit, (page + 1) * limit - 1);
    
    if (messagesError) throw messagesError;
    
    // 마지막으로 읽은 시간 업데이트 (컬럼이 없을 수 있음)
    try {
      const { error: updateError } = await supabase
        .from('room_participants')
        .update({ last_read: new Date().toISOString() })
        .eq('room_id', roomId)
        .eq('user_id', userId);
      
      if (updateError && updateError.code !== '42703') {
        console.warn('마지막 읽은 시간 업데이트 실패:', updateError);
      }
    } catch (updateErr) {
      console.warn('last_read 업데이트 중 오류 (무시):', updateErr);
    }
    
    return { success: true, messages: messagesData || [] };
  } catch (error) {
    if (__DEV__) console.error('메시지 목록 가져오기 오류:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 메시지 전송
 * @param {string} roomId - 채팅방 ID
 * @param {string} content - 메시지 내용
 * @returns {Promise<Object>} - 전송된 메시지 정보
 */
export const sendMessage = async (roomId, content) => {
  try {
    if (!roomId || !content.trim()) {
      throw new Error('채팅방 ID와 메시지 내용이 필요합니다.');
    }
    
    // 현재 사용자 세션 확인
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      throw new Error('로그인이 필요합니다.');
    }
    
    const userId = sessionData.session.user.id;
    const userName = sessionData.session.user.user_metadata?.name || '사용자';
    
    // 텍스트 메시지만 전송 (다른 타입의 메시지는 거부)
    if (typeof content !== 'string') {
      throw new Error('텍스트 메시지만 전송할 수 있습니다.');
    }
    
    // 메시지 전송
    const { data: messageData, error: messageError } = await supabase
      .from('messages')
      .insert({
        room_id: roomId,
        sender_id: userId,
        sender_name: userName,
        content: content.trim(),
        created_at: new Date().toISOString(),
        message_type: 'text' // 메시지 타입을 명시적으로 'text'로 설정
      })
      .select()
      .single();
    
    if (messageError) throw messageError;
    
    return { success: true, message: messageData };
  } catch (error) {
    if (__DEV__) console.error('메시지 전송 오류:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 메시지 실시간 구독
 * @param {string} roomId - 채팅방 ID
 * @param {Function} onNewMessage - 새 메시지 수신 시 호출될 콜백 함수
 * @returns {Object} - 구독 객체 (unsubscribe 메소드 포함)
 */
export const subscribeToMessages = (roomId, onNewMessage) => {
  if (!roomId || typeof onNewMessage !== 'function') {
    console.error('유효하지 않은 파라미터입니다.');
    return { unsubscribe: () => {} };
  }
  
  try {
    const subscription = supabase
      .channel(`room:${roomId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `room_id=eq.${roomId}`
      }, (payload) => {
        onNewMessage(payload.new);
      })
      .subscribe();
    
    return subscription;
  } catch (error) {
    console.error('메시지 구독 오류:', error);
    return { unsubscribe: () => {} };
  }
};

/**
 * 채팅방에 참여자 추가
 * @param {string} roomId - 채팅방 ID
 * @param {Array<string>} userIds - 추가할 사용자 ID 배열
 * @returns {Promise<Object>} - 결과
 */
export const addParticipantsToRoom = async (roomId, userIds) => {
  try {
    if (!roomId || !userIds || userIds.length === 0) {
      throw new Error('채팅방 ID와 사용자 ID 목록이 필요합니다.');
    }
    
    // 현재 사용자 세션 확인
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      throw new Error('로그인이 필요합니다.');
    }
    
    const currentUserId = sessionData.session.user.id;
    
    // 채팅방 정보 가져오기
    const { data: roomData, error: roomError } = await supabase
      .from('chat_rooms')
      .select('*, participants')
      .eq('id', roomId)
      .single();
    
    if (roomError) throw roomError;
    
    // 사용자가 방 생성자가 아니면 오류
    if (roomData.creator_id !== currentUserId) {
      throw new Error('채팅방 참여자를 추가할 권한이 없습니다.');
    }
    
    // 참여자 기록 생성
    const participantRecords = userIds.map(userId => ({
      room_id: roomId,
      user_id: userId
    }));
    
    const { error: participantError } = await supabase
      .from('room_participants')
      .insert(participantRecords);
    
    if (participantError) throw participantError;
    
    // 참여자 목록 업데이트
    let participants = [];
    try {
      participants = JSON.parse(roomData.participants || '[]');
    } catch (e) {
      participants = [];
    }
    
    // 새 참여자 추가 (중복 방지)
    const updatedParticipants = [...new Set([...participants, ...userIds])];
    
    const { error: updateError } = await supabase
      .from('chat_rooms')
      .update({
        participants: JSON.stringify(updatedParticipants)
      })
      .eq('id', roomId);
    
    if (updateError) throw updateError;
    
    return { success: true };
  } catch (error) {
    console.error('채팅방 참여자 추가 오류:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 채팅방에서 나가기
 * @param {string} roomId - 채팅방 ID
 * @returns {Promise<Object>} - 결과
 */
export const leaveRoom = async (roomId) => {
  try {
    if (!roomId) {
      throw new Error('채팅방 ID가 필요합니다.');
    }
    
    // 현재 사용자 세션 확인
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      throw new Error('로그인이 필요합니다.');
    }
    
    const userId = sessionData.session.user.id;
    const userName = sessionData.session.user.user_metadata?.name || '사용자';
    
    // 참여자 기록 삭제
    const { error: deleteError } = await supabase
      .from('room_participants')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', userId);
    
    if (deleteError) throw deleteError;
    
    // 나가기 메시지 전송
    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        room_id: roomId,
        sender_id: userId,
        sender_name: userName,
        content: `${userName}님이 채팅방을 나갔습니다.`
      });
    
    if (messageError) {
      console.warn('나가기 메시지 전송 실패:', messageError);
    }
    
    return { success: true };
  } catch (error) {
    console.error('채팅방 나가기 오류:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 읽지 않은 메시지 수 가져오기
 * @returns {Promise<Object>} - 읽지 않은 메시지 수
 */
export const getUnreadMessageCount = async () => {
  try {
    // 게스트 모드일 때는 0 반환
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      return { success: true, totalUnread: 0, roomUnread: {} };
    }
    
    const userId = sessionData.session.user.id;
    
    // 사용자가 참여 중인 채팅방 정보 가져오기
    const { data: participantData, error: participantError } = await supabase
      .from('room_participants')
      .select('room_id, last_read')
      .eq('user_id', userId);
    
    if (participantError) throw participantError;
    
    if (!participantData || participantData.length === 0) {
      return { success: true, totalUnread: 0, roomUnread: {} };
    }
    
    // 각 채팅방의 안 읽은 메시지 수 계산
    const unreadCounts = await Promise.all(participantData.map(async (participant) => {
      const { room_id, last_read } = participant;
      const lastReadTime = last_read || new Date(0).toISOString();
      
      // 읽지 않은 메시지 수 쿼리
      const { data: unreadData, error: unreadError } = await supabase
        .from('messages')
        .select('id', { count: 'exact' })
        .eq('room_id', room_id)
        .gt('created_at', lastReadTime)
        .neq('sender_id', userId);
      
      if (unreadError) throw unreadError;
      
      return {
        roomId: room_id,
        unread: unreadData.length || 0
      };
    }));
    
    // 총 읽지 않은 메시지 수 계산
    const totalUnread = unreadCounts.reduce((sum, item) => sum + item.unread, 0);
    
    // 채팅방별 읽지 않은 메시지 수 계산
    const roomUnread = unreadCounts.reduce((obj, item) => {
      obj[item.roomId] = item.unread;
      return obj;
    }, {});
    
    return { success: true, totalUnread, roomUnread };
  } catch (error) {
    console.error('읽지 않은 메시지 수 가져오기 오류:', error);
    return { success: false, error: error.message };
  }
}; 

// 채팅 서비스 - Supabase Realtime 전용
class ChatService {
  constructor() {
    this.activeChannels = {};
    this.callbacks = {};
  }
  
  // 채팅방 입장
  joinRoom(roomId, username, callbacks = {}) {
    
    // 콜백 함수 저장
    this.callbacks[roomId] = callbacks;
    
    // Supabase 채널 연결
    return this.joinSupabaseChannel(roomId, username);
  }
  
  // Supabase 채널 연결
  async joinSupabaseChannel(roomId, username) {
    try {
      
      // 이미 연결된 채널이 있는 경우 재사용
      if (this.activeChannels[roomId]) {
        return true;
      }
      
      // 채널 생성
      const channel = createChatChannel(roomId);
      
      // 메시지 수신 핸들러
      channel.on('broadcast', { event: 'message' }, (payload) => {
        
        const callbackFn = this.callbacks[roomId]?.onMessage;
        if (callbackFn && payload?.payload) {
          try {
            callbackFn(payload.payload);
          } catch (error) {
            console.error('[Chat] 메시지 콜백 처리 오류:', error);
          }
        }
      });
      
      // 사용자 참여 이벤트 핸들러
      channel.on('presence', { event: 'join' }, (payload) => {
        
        const callbackFn = this.callbacks[roomId]?.onUserJoin;
        if (callbackFn) {
          try {
            const users = Object.keys(payload?.joins || {}).map(key => ({
              id: key,
              name: payload.joins[key]?.username || 'Guest',
              online: true,
              joinedAt: new Date()
            }));
            
            callbackFn(users);
          } catch (error) {
            console.error('[Chat] 사용자 입장 콜백 처리 오류:', error);
          }
        }
      });
      
      // 사용자 퇴장 이벤트 핸들러
      channel.on('presence', { event: 'leave' }, (payload) => {
        
        const callbackFn = this.callbacks[roomId]?.onUserLeave;
        if (callbackFn) {
          try {
            const users = Object.keys(payload?.leaves || {}).map(key => ({
              id: key,
              name: payload.leaves[key]?.username || 'Guest'
            }));
            
            callbackFn(users);
          } catch (error) {
            console.error('[Chat] 사용자 퇴장 콜백 처리 오류:', error);
          }
        }
      });
      
      // 구독 시작 - 사용자 추적
      await channel.subscribe(async (status) => {
        
        if (status === 'SUBSCRIBED') {
          // 사용자 추적 시작
          await channel.track({
            username: username,
            online_at: new Date().toISOString()
          });
          
          // 연결 성공 콜백
          const callbackFn = this.callbacks[roomId]?.onConnected;
          if (callbackFn) {
            try {
              callbackFn(true);
            } catch (error) {
              console.error('[Chat] 연결 콜백 처리 오류:', error);
            }
          }
        } else if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
          // 연결 실패 처리
          console.error(`[Chat] 채널 연결 실패: ${status}`);
          
          const callbackFn = this.callbacks[roomId]?.onError;
          if (callbackFn) {
            try {
              callbackFn({
                type: 'connection_error',
                message: `Supabase 채널 연결 실패: ${status}`
              });
            } catch (error) {
              console.error('[Chat] 오류 콜백 처리 오류:', error);
            }
          }
        }
      });
      
      // 채널 저장
      this.activeChannels[roomId] = channel;
      return true;
    } catch (error) {
      
      // 오류 콜백
      const callbackFn = this.callbacks[roomId]?.onError;
      if (callbackFn) {
        try {
          callbackFn({
            type: 'supabase_error',
            message: `Supabase 연결 오류: ${error.message || error}`,
            error
          });
        } catch (cbError) {
          console.error('[Chat] 오류 콜백 처리 오류:', cbError);
        }
      }
      return false;
    }
  }
  
  // 일반 WebSocket 연결 (Supabase 사용하지 않을 경우)
  connectWebSocket(roomId, username) {
    try {
      
      // 이미 연결되어 있으면 재사용
      if (this.websocketConnections[roomId] && 
          this.websocketConnections[roomId].readyState === WebSocket.OPEN) {
        return true;
      }
      
      // 사용할 서버 URL - 연결 시점에 동적으로 가져오기
      const serverUrl = getServerUrl();
      const wsUrl = `${serverUrl}/ws/${roomId}?username=${encodeURIComponent(username)}`;
      
      
      // WebSocket 연결
      // 오디오 세션 간섭 방지를 위한 WebSocket 옵션 설정
      let ws;
      let wsOptions = {};
      
      // 플랫폼에 따른 오디오 세션 간섭 방지 설정
      if (Platform.OS === 'android' || Platform.OS === 'ios') {
        wsOptions = {
          headers: { 'X-Dont-Interrupt-Audio': 'true' },
          wsOptions: {
            dontInterruptAudio: true
          }
        };
      }
      
      try {
        ws = new WebSocket(wsUrl, [], wsOptions);
        
        // 오디오 세션 방해하지 않도록 속성 설정 시도 (추가 보호 레이어)
        if (ws && typeof ws === 'object') {
          // WebSocket 인스턴스에 직접 속성 설정
          try {
            ws.dontInterruptAudio = true;
          } catch (propError) {
          }
          
          // 생성자 프로토타입 설정은 데스크톱 환경에서만 시도
          if (Platform.OS === 'web' && ws.constructor) {
            try {
              if (ws.constructor && ws.constructor.prototype) {
                Object.defineProperty(ws.constructor.prototype, 'dontInterruptAudio', {
                  value: true,
                  writable: false,
                  configurable: false
                });
              }
            } catch (propError) {
              // 속성 설정 실패해도 계속 진행
            }
          }
        }
      } catch (wsError) {
        console.error('[Chat] WebSocket 생성 오류:', wsError);
        // 일반 WebSocket으로 폴백
        ws = new WebSocket(wsUrl);
      }
      
      // 이벤트 핸들러 설정
      ws.onopen = () => {
        
        const callbackFn = this.callbacks[roomId]?.onConnected;
        if (callbackFn) {
          try {
            callbackFn(true);
          } catch (error) {
            console.error('[Chat] 연결 콜백 처리 오류:', error);
          }
        }
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          const callbackFn = this.callbacks[roomId]?.onMessage;
          if (callbackFn) {
            try {
              callbackFn(data);
            } catch (error) {
              console.error('[Chat] 메시지 콜백 처리 오류:', error);
            }
          }
        } catch (error) {
          console.error('[Chat] 메시지 파싱 오류:', event.data, error);
        }
      };
      
      ws.onerror = (error) => {
        console.error(`[Chat] WebSocket 오류 (${roomId}):`, error);
        
        const callbackFn = this.callbacks[roomId]?.onError;
        if (callbackFn) {
          try {
            callbackFn({
              type: 'websocket_error',
              message: `WebSocket 오류: ${error.message || '알 수 없는 오류'}`,
              error
            });
          } catch (cbError) {
            console.error('[Chat] 오류 콜백 처리 오류:', cbError);
          }
        }
      };
      
      ws.onclose = () => {
        
        const callbackFn = this.callbacks[roomId]?.onDisconnected;
        if (callbackFn) {
          try {
            callbackFn();
          } catch (error) {
            console.error('[Chat] 연결 종료 콜백 처리 오류:', error);
          }
        }
        
        // 연결 목록에서 제거
        delete this.websocketConnections[roomId];
      };
      
      // 연결 저장
      this.websocketConnections[roomId] = ws;
      return true;
    } catch (error) {
      console.error(`[Chat] WebSocket 연결 시도 오류 (${roomId}):`, error);
      
      // 오류 콜백
      const callbackFn = this.callbacks[roomId]?.onError;
      if (callbackFn) {
        try {
          callbackFn({
            type: 'websocket_init_error',
            message: `WebSocket 초기화 오류: ${error.message || error}`,
            error
          });
        } catch (cbError) {
          console.error('[Chat] 오류 콜백 처리 오류:', cbError);
        }
      }
      return false;
    }
  }
  
  // 메시지 전송
  async sendMessage(roomId, message, username) {
    
    // Supabase 사용시
    if (this.useSupabase && this.activeChannels[roomId]) {
      try {
        const channel = this.activeChannels[roomId];
        
        // 브로드캐스트 메시지 전송
        await channel.send({
          type: 'broadcast',
          event: 'message',
          payload: {
            username: username,
            message: message,
            timestamp: new Date().toISOString(),
            type: 'chat'
          }
        });
        
        return true;
      } catch (error) {
        console.error(`[Chat] Supabase 메시지 전송 오류 (${roomId}):`, error);
        return false;
      }
    } 
    // WebSocket 사용시
    else if (this.websocketConnections[roomId]) {
      try {
        const ws = this.websocketConnections[roomId];
        
        if (ws.readyState === WebSocket.OPEN) {
          const messageData = {
            username: username,
            message: message,
            timestamp: new Date().toISOString(),
            type: 'chat'
          };
          
          ws.send(JSON.stringify(messageData));
          return true;
        } else {
          return false;
        }
      } catch (error) {
        console.error(`[Chat] WebSocket 메시지 전송 오류 (${roomId}):`, error);
        return false;
      }
    } else {
      return false;
    }
  }
  
  // 채팅방 퇴장
  async leaveRoom(roomId) {
    
    // Supabase 채널 연결 해제
    if (this.activeChannels[roomId]) {
      try {
        const channel = this.activeChannels[roomId];
        await channel.unsubscribe();
        delete this.activeChannels[roomId];
      } catch (error) {
        console.error(`[Chat] Supabase 채널 연결 해제 오류 (${roomId}):`, error);
      }
    }
    
    // 콜백 정리
    delete this.callbacks[roomId];
  }
  
  // 모든 채널 및 연결 해제
  async disconnectAll() {
    
    // Supabase 채널 모두 해제
    for (const roomId in this.activeChannels) {
      try {
        await this.activeChannels[roomId].unsubscribe();
      } catch (error) {
        console.error(`[Chat] Supabase 채널 연결 해제 오류 (${roomId}):`, error);
      }
    }
    
    // 모든 리소스 초기화
    this.activeChannels = {};
    this.callbacks = {};
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
const chatService = new ChatService();
export default chatService; 