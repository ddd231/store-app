// Supabase 채팅 채널 관련 모듈
import { isInFallbackMode } from './config';
import { supabase } from './client';

/**
 * 채팅 채널 생성 - 실시간 메시지 수신을 위한 채널 설정
 * @param {string} roomId - 채팅방 ID
 * @returns {Object} 채널 객체
 */
export const createChatChannel = (roomId) => {
  
  // 폴백 모드가 아닌 경우 실제 Supabase Realtime 채널 반환
  if (!isInFallbackMode()) {
    try {
      // 실제 Supabase 채널 반환 시도
      return supabase.channel(`room:${roomId}`);
    } catch (error) {
      console.error('[채팅] Supabase 채널 생성 실패:', error);
    }
  }
  
  // 폴백 모드 또는 오류 발생 시 모의 채널 객체 반환
  
  // 이벤트 콜백 저장소
  const callbacks = {};
  
  // 모의 채널 객체
  return {
    // 이벤트 리스너 등록
    on: (event, callback) => {
      callbacks[event] = callback;
      
      // 초기 연결 성공 이벤트 트리거 (지연 실행)
      if (event === 'system') {
        setTimeout(() => {
          callback?.({ 
            type: 'system', 
            event: 'connected',
            timestamp: Date.now()
          });
        }, 500);
      }
      
      // 구독 모의 객체 반환
      return {
        subscribe: () => {
          
          // 언구독 함수 포함 객체 반환
          return {
            unsubscribe: () => {
              delete callbacks[event];
            }
          };
        }
      };
    },
    
    // 채널 구독
    subscribe: () => {
      
      // 언구독 함수 포함 객체 반환
      return {
        unsubscribe: () => {
          
          // 모든 콜백 해제
          Object.keys(callbacks).forEach(key => {
            delete callbacks[key];
          });
        }
      };
    }
  };
};

export default {
  createChatChannel
};
