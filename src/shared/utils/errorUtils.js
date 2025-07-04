/**
 * 에러 처리 유틸리티
 * 일관된 에러 처리 및 사용자 피드백
 */

import { Alert } from 'react-native';
import { logger } from './logger';

/**
 * 표준화된 에러 메시지 처리
 */
export function handleError(error, context = '작업') {
  let message = `${context} 중 오류가 발생했습니다.`;
  
  if (!error) return message;

  // Supabase 에러 처리
  if (error.message) {
    if (error.message.includes('JWT')) {
      message = '로그인이 만료되었습니다. 다시 로그인해주세요.';
    } else if (error.message.includes('Network')) {
      message = '네트워크 연결을 확인해주세요.';
    } else if (error.message.includes('duplicate')) {
      message = '이미 존재하는 데이터입니다.';
    } else if (error.message.includes('not found')) {
      message = '요청한 데이터를 찾을 수 없습니다.';
    } else if (__DEV__) {
      message = error.message;
    }
  }

  logger.error(`[${context}] 에러:`, error);
  return message;
};

/**
 * 에러 알림 표시
 */
export function showErrorAlert(error, context = '작업', callback = null) {
  const message = handleError(error, context);
  
  Alert.alert(
    '오류',
    message,
    [{ text: '확인', onPress: callback }]
  );
};

/**
 * 성공 알림 표시
 */
export function showSuccessAlert(message, callback = null) {
  Alert.alert(
    '성공',
    message,
    [{ text: '확인', onPress: callback }]
  );
};

/**
 * 확인 다이얼로그 표시
 */
export function showConfirmDialog(title, message, onConfirm, onCancel = null) {
  Alert.alert(
    title,
    message,
    [
      { text: '취소', style: 'cancel', onPress: onCancel },
      { text: '확인', onPress: onConfirm }
    ]
  );
};

/**
 * 네트워크 에러 체크
 */
export function isNetworkError(error) {
  return error?.message?.includes('Network') || 
         error?.message?.includes('fetch') ||
         error?.code === 'NETWORK_ERROR';
};

/**
 * 인증 에러 체크
 */
export function isAuthError(error) {
  return error?.message?.includes('JWT') ||
         error?.message?.includes('auth') ||
         error?.message?.includes('unauthorized') ||
         error?.status === 401;
};

/**
 * 에러 로깅 (프로덕션에서는 로깅 서비스로 전송)
 */
export function logError(error, context, additionalData = {}) {
  const errorData = {
    message: error?.message || 'Unknown error',
    stack: error?.stack,
    context,
    timestamp: new Date().toISOString(),
    ...additionalData
  };

  if (__DEV__) {
    logger.error('[Error Log]', errorData);
  } else {
    // 프로덕션에서는 Sentry, Bugsnag 등으로 전송
    // crashlytics().recordError(error);
  }
};