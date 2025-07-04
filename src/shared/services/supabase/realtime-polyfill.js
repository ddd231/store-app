// Supabase Realtime 관련 폴리필 및 헬퍼 함수
import { isHermesEngine } from './config';

/**
 * Hermes 엔진 환경에서 Realtime 클라이언트를 안전하게 초기화
 * Realtime 관련 프로토타입 오류 방지를 위한 폴리필
 */
export function initRealtimePolyfills() {
  // Hermes 엔진 환경에서만 필요한 설정
  if (isHermesEngine) {
    
    // Realtime 관련 함수를 미리 정의하여 prototype 오류 방지
    if (typeof global._initRealtimeClient !== 'function') {
      global._initRealtimeClient = function() {
        return {
          connect: function() { return Promise.resolve({}); },
          disconnect: function() {},
          channel: function() { return {
            on: function() { return {}; },
            subscribe: function() { return { unsubscribe: function() {} }; }
          }; },
          removeAllChannels: function() {}
        };
      };
    }
  }
};

export default {
  initRealtimePolyfills
};
