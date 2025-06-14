// Supabase 네트워크 유틸리티 모듈
import { REQUEST_TIMEOUT, isInFallbackMode } from './config';

/**
 * 요청 타임아웃 Promise 생성
 * @param {number} ms - 타임아웃 시간(ms)
 * @returns {Promise<never>} 타임아웃 시 reject되는 Promise
 */
export const timeoutPromise = (ms) => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Request timed out after ${ms}ms`));
    }, ms);
  });
};

/**
 * 안전한 fetch 함수 - WebSocket 및 realtime 요청을 안전하게 처리
 * @param {string} url - 요청 URL
 * @param {object} init - fetch 옵션
 * @returns {Promise<Response>} fetch 응답
 */
export const safeFetch = async (url, init) => {
  // 요청 시작 시간 기록
  const requestStartTime = Date.now();
  
  // URL이 문자열이 아닌 경우 안전하게 처리
  if (typeof url !== 'string') {
    return Promise.resolve(
      new Response(JSON.stringify({ error: null, data: {} }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );
  }
  
  // 무한 로딩 상태를 방지하기 위한 로직 추가
  // 30초 이상 지속되는 요청은 강제 중단
  const forceTimeoutAfter = 30000; // 30초
  
  // WebSocket/realtime 관련 요청 차단 코드 비활성화
  // 모든 WebSocket 및 Realtime 요청 허용
  if (false) { // 항상 false로 평가되도록 변경 (차단 코드 비활성화)
    
    return Promise.resolve(
      new Response(JSON.stringify({ 
        error: null, 
        data: { 
          token: 'dummy-token', 
          timestamp: Date.now(),
          message: 'WebSocket connection simulated'
        } 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );
  }

  // 실제 요청 시도 함수
  const attemptFetch = async (retries = 0) => {
    try {
      // 타임아웃과 함께 fetch 실행
      const response = await Promise.race([
        fetch(url, init),
        timeoutPromise(REQUEST_TIMEOUT)
      ]);
      
      // 응답 확인
      if (!response.ok && response.status >= 500 && response.status < 600) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      return response;
    } catch (error) {
      // 최대 재시도 횟수를 초과한 경우
      if (retries >= 2) {
        console.error(`[네트워크] 요청 실패 (최대 재시도 횟수 초과): ${url}`, error);
        
        // 오류 응답 모의 생성
        return new Response(JSON.stringify({ 
          error: { message: error.message }, 
          data: null 
        }), {
          status: 200, // 실패해도 200으로 응답하여 앱이 계속 동작하도록 함
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // 재시도
      
      // 점진적으로 지연 시간 증가
      const delay = 1000 * Math.pow(2, retries);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return attemptFetch(retries + 1);
    }
  };

  // 요청 실행
  try {
    // 강제 타임아웃 설정
    const forceTimeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Request force timed out after ${forceTimeoutAfter}ms`));
      }, forceTimeoutAfter);
    });
    
    // 실제 요청과 강제 타임아웃 중 먼저 완료되는 것 선택
    return await Promise.race([attemptFetch(), forceTimeoutPromise]);
  } catch (error) {
    console.error(`[네트워크] 요청 최종 실패: ${url}`, error);
    
    // 오류 응답 모의 생성
    return new Response(JSON.stringify({ 
      error: { message: error.message }, 
      data: null 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export default {
  timeoutPromise,
  safeFetch
};
