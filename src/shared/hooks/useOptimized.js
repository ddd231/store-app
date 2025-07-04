/**
 * 성능 최적화 React Hooks
 * 공통 최적화 패턴 제공
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

/**
 * 디바운스된 값을 반환하는 훅
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
 * 비동기 작업을 위한 최적화된 상태 관리
 */
export function useAsyncState(initialState = null) {
  const [state, setState] = useState({
    data: initialState,
    loading: false,
    error: null
  });

  const setLoading = useCallback(function(loading) {
    setState(function(prev) { return { ...prev, loading }; });
  }, []);

  const setData = useCallback(function(data) {
    setState({ data, loading: false, error: null });
  }, []);

  const setError = useCallback(function(error) {
    setState(function(prev) { return { ...prev, loading: false, error }; });
  }, []);

  const reset = useCallback(function() {
    setState({ data: initialState, loading: false, error: null });
  }, [initialState]);

  return {
    ...state,
    setLoading,
    setData,
    setError,
    reset
  };
};

/**
 * 이전 값을 기억하는 훅
 */
export function usePrevious(value) {
  const ref = useRef();
  useEffect(function() {
    ref.current = value;
  });
  return ref.current;
};

/**
 * 컴포넌트 마운트 상태 추적
 */
export function useIsMounted() {
  const isMountedRef = useRef(true);
  
  useEffect(function() {
    return function() {
      isMountedRef.current = false;
    };
  }, []);

  return useCallback(function() { return isMountedRef.current; }, []);
};

/**
 * 최적화된 이벤트 핸들러
 */
export function useOptimizedCallback(fn, deps) {
  return useCallback(fn, deps);
};

/**
 * 메모화된 계산 결과
 */
export function useOptimizedMemo(fn, deps) {
  return useMemo(fn, deps);
};

/**
 * 배열 필터링/정렬 최적화
 */
export function useOptimizedFilter(items, filterFn, sortFn) {
  return useMemo(function() {
    if (!items || !Array.isArray(items)) return [];
    
    let result = items;
    
    if (filterFn) {
      result = result.filter(filterFn);
    }
    
    if (sortFn) {
      result = result.sort(sortFn);
    }
    
    return result;
  }, [items, filterFn, sortFn]);
};

/**
 * 검색 기능 최적화
 */
export function useOptimizedSearch(items, searchQuery, searchFields) {
  const debouncedQuery = useDebounce(searchQuery, 300);
  
  return useMemo(function() {
    if (!items || !Array.isArray(items) || !debouncedQuery.trim()) {
      return items || [];
    }
    
    const query = debouncedQuery.toLowerCase();
    
    return items.filter(function(item) {
      return searchFields.some(function(field) {
        const value = item[field];
        return value && value.toString().toLowerCase().includes(query);
      });
    });
  }, [items, debouncedQuery, searchFields]);
};