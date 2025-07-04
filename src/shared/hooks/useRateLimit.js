import { useRef, useCallback } from 'react';

/**
 * Rate limiting을 위한 커스텀 훅
 * @param {string} key - Rate limit 구분 키
 * @param {Object} options - 설정 옵션
 * @param {number} options.maxAttempts - 최대 시도 횟수
 * @param {number} options.windowMs - 시간 창 (밀리초)
 */
export function useRateLimit(key, options = {}) {
  const { maxAttempts = 10, windowMs = 15 * 60 * 1000 } = options;
  const attemptsRef = useRef(new Map());

  const checkLimit = useCallback(function() {
    const now = Date.now();
    const attempts = attemptsRef.current.get(key) || [];
    
    // 시간 창 내의 시도만 필터링
    const recentAttempts = attempts.filter(function(timestamp) { return now - timestamp < windowMs; });
    
    if (recentAttempts.length >= maxAttempts) {
      return false; // 제한 초과
    }
    
    // 새로운 시도 추가
    recentAttempts.push(now);
    attemptsRef.current.set(key, recentAttempts);
    
    return true; // 허용
  }, [key, maxAttempts, windowMs]);

  const reset = useCallback(function() {
    attemptsRef.current.delete(key);
  }, [key]);

  const getRemainingAttempts = useCallback(function() {
    const now = Date.now();
    const attempts = attemptsRef.current.get(key) || [];
    const recentAttempts = attempts.filter(function(timestamp) { return now - timestamp < windowMs; });
    return Math.max(0, maxAttempts - recentAttempts.length);
  }, [key, maxAttempts, windowMs]);

  return {
    checkLimit,
    reset,
    getRemainingAttempts,
  };
}