// Supabase 진단 및 유틸리티 모듈
import { Platform } from 'react-native';
import { 
  isWeb, 
  isInFallbackMode, 
  REQUEST_TIMEOUT,
  EFFECTIVE_MAX_RETRIES,
  EFFECTIVE_RETRY_DELAY
} from './config';
import { supabase } from './client';

/**
 * Supabase 연결 테스트
 * @returns {Promise<Object>} 테스트 결과
 */
export const testSupabaseConnection = async () => {
  try {
    
    // 기본 응답 모델
    const baseResponse = {
      success: false,
      timestamp: Date.now(),
      error: null,
      message: null
    };
    
    // 웹 환경에서는 간단한 테스트만 수행
    if (isWeb) {
      
      try {
        const { data, error } = await supabase
          .from('connection_test')
          .select('*')
          .limit(1)
          .maybeSingle();
        
        if (error) throw error;
        
        return {
          ...baseResponse,
          success: true,
          message: '웹 환경에서 연결 성공'
        };
      } catch (error) {
        console.error('[Supabase] 웹 연결 테스트 실패:', error);
        return {
          ...baseResponse,
          error: error.message || '웹 연결 테스트 실패',
          message: '웹 환경에서 연결 실패'
        };
      }
    }
    
    // 시간 제한 설정 (5초)
    const timeoutPromise = new Promise(resolve => {
      setTimeout(() => {
        resolve({
          ...baseResponse,
          error: 'Connection test timed out',
          message: '연결 테스트 시간 초과'
        });
      }, 5000);
    });
    
    // 실제 연결 테스트
    const testPromise = new Promise(async resolve => {
      try {
        // 간단한 쿼리 실행
        const { data, error } = await supabase
          .from('connection_test')
          .select('*')
          .limit(1)
          .maybeSingle();
        
        if (error) throw error;
        
        resolve({
          ...baseResponse,
          success: true,
          message: '데이터베이스 연결 성공'
        });
      } catch (error) {
        console.error('[Supabase] 연결 테스트 실패:', error);
        resolve({
          ...baseResponse,
          error: error.message || '알 수 없는 오류',
          message: '데이터베이스 연결 실패'
        });
      }
    });
    
    // 타임아웃과 테스트 중 먼저 완료되는 것 반환
    return await Promise.race([testPromise, timeoutPromise]);
  } catch (error) {
    console.error('[Supabase] 연결 테스트 중 예외 발생:', error);
    return {
      success: false,
      timestamp: Date.now(),
      error: error.message || '알 수 없는 오류',
      message: '연결 테스트 중 예외 발생'
    };
  }
};

/**
 * Supabase 시스템 진단
 * @returns {Promise<Object>} 진단 결과
 */
export const diagnoseSupabaseIssues = async () => {
  try {
    
    // 웹 환경에서는 즉시 결과 반환 (무한 로딩 방지)
    const hasWindow = typeof window !== 'undefined';
    const hasDocument = typeof document !== 'undefined';
    
    // 웹에서는 최소한의 진단만 실행
    if (isWeb) {
      return {
        timestamp: new Date().toISOString(),
        environment: {
          platform: Platform.OS,
          isWeb: true,
          hasWindow,
          hasDocument,
          url: hasWindow ? window.location.href : null,
          userAgent: hasWindow ? window.navigator.userAgent : null,
        },
        system: {
          inFallbackMode: isInFallbackMode(),
          timeoutMs: REQUEST_TIMEOUT,
        },
        connection: {
          success: true,
          message: '웹 환경에서는 상세 진단을 실행하지 않습니다'
        }
      };
    }
    
    // 모바일에서는 전체 진단 실행 - 타임아웃 방지
    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          timestamp: new Date().toISOString(),
          error: null,
          timedOut: true,
          environment: { platform: Platform.OS },
          system: { inFallbackMode: isInFallbackMode() }
        });
      }, 3000); // 3초 타임아웃
    });
    
    // 실제 진단 작업을 위한 Promise
    const diagnosisPromise = new Promise(async (resolve) => {
      try {
        // 기본 연결 테스트
        const connectionTest = await testSupabaseConnection();
        
        // 폴백 모드 상태 확인
        const fallbackStatus = isInFallbackMode();
        
        // 세션 확인 - 오류에 대비한 안전한 처리
        let sessionData = { session: null };
        try {
          const result = await supabase.auth.getSession();
          sessionData = result.data || { session: null };
        } catch (sessionError) {
          console.error('[진단] 세션 확인 오류:', sessionError);
        }
        
        resolve({
          timestamp: new Date().toISOString(),
          timedOut: false,
          connection: {
            success: connectionTest.success,
            message: connectionTest.message || connectionTest.error || '연결 상태 확인됨',
            error: connectionTest.error || null,
          },
          environment: {
            platform: Platform.OS,
            isWeb: isWeb,
          },
          system: {
            inFallbackMode: fallbackStatus,
            retryLimit: EFFECTIVE_MAX_RETRIES,
            retryDelay: EFFECTIVE_RETRY_DELAY,
          },
          auth: {
            hasSession: !!sessionData?.session,
            userID: sessionData?.session?.user?.id || null,
          }
        });
      } catch (error) {
        // 오류 발생 시 일부 정보만 반환
        resolve({
          timestamp: new Date().toISOString(),
          error: error.message || '진단 실패',
          timedOut: false,
          environment: { platform: Platform.OS },
          system: { inFallbackMode: isInFallbackMode() }
        });
      }
    });
    
    // 두 Promise 중 먼저 완료되는 것을 반환
    const diagnosticInfo = await Promise.race([diagnosisPromise, timeoutPromise]);
    return diagnosticInfo;
  } catch (error) {
    // 안전망
    console.error('[Supabase] 진단 프로세스 오류:', error);
    return {
      timestamp: new Date().toISOString(),
      error: error.message || '진단 실패',
      system: {
        inFallbackMode: isInFallbackMode(),
        environment: {
          platform: Platform.OS,
          isWeb: Platform.OS === 'web',
        }
      }
    };
  }
};

export default {
  testSupabaseConnection,
  diagnoseSupabaseIssues
};
