import { QueryClient } from '@tanstack/react-query';
import { logger } from '../utils/logger';

// React Query 설정
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 캐시 시간 설정
      staleTime: 5 * 60 * 1000, // 5분
      cacheTime: 10 * 60 * 1000, // 10분
      
      // 재시도 설정
      retry: function(failureCount, error) {
        // 4xx 에러는 재시도하지 않음
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // 3번까지 재시도
        return failureCount < 3;
      },
      
      // 백그라운드에서 자동 새로고침 비활성화 (모바일 배터리 절약)
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      
      // 오류 로깅
      onError: function(error) {
        logger.error('Query Error:', error);
      },
    },
    mutations: {
      // 뮤테이션 재시도 비활성화
      retry: false,
      
      // 오류 로깅
      onError: function(error) {
        logger.error('Mutation Error:', error);
      },
    },
  },
});

// 에러 경계를 위한 글로벌 에러 핸들러
queryClient.setMutationDefaults(['upload'], {
  mutationFn: async function(variables) {
    // 업로드 관련 뮤테이션 기본 설정
    throw new Error('Upload mutation not implemented');
  },
});

// 개발 모드에서만 상세 로깅
if (__DEV__) {
  queryClient.setDefaultOptions({
    queries: {
      ...queryClient.getDefaultOptions().queries,
      onSuccess: function(data) {
        logger.info('Query Success:', data);
      },
    },
    mutations: {
      ...queryClient.getDefaultOptions().mutations,
      onSuccess: function(data) {
        logger.info('Mutation Success:', data);
      },
    },
  });
}