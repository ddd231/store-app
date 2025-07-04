import { useState, useEffect } from 'react';

/**
 * 디바운스 훅 - 입력값 변경을 지연시켜 성능 최적화
 * @param {*} value - 디바운스할 값
 * @param {number} delay - 지연 시간 (밀리초)
 * @returns {*} 디바운스된 값
 */
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(function() {
    const handler = setTimeout(function() {
      setDebouncedValue(value);
    }, delay);

    return function() {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * 디바운스된 콜백 훅
 * @param {Function} callback - 실행할 함수
 * @param {number} delay - 지연 시간
 * @param {Array} dependencies - 의존성 배열
 * @returns {Function} 디바운스된 함수
 */
export function useDebouncedCallback(callback, delay, dependencies = []) {
  const [debouncedCallback, setDebouncedCallback] = useState(null);

  useEffect(function() {
    const handler = setTimeout(function() {
      setDebouncedCallback(function() { return callback; });
    }, delay);

    return function() {
      clearTimeout(handler);
    };
  }, [...dependencies, delay]);

  return debouncedCallback;
};