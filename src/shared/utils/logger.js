/**
 * 로깅 유틸리티
 * 개발/프로덕션 환경에 따른 적절한 로깅 처리
 */

/**
 * 개발 전용 로그
 */
export function devLog(...args) {
  if (__DEV__) {
    console.log('[DEV]', ...args);
  }
};

/**
 * 개발 전용 에러 로그
 */
export function devError(...args) {
  if (__DEV__) {
    console.error('[DEV ERROR]', ...args);
  }
};

/**
 * 개발 전용 경고 로그
 */
export function devWarn(...args) {
  if (__DEV__) {
    console.warn('[DEV WARN]', ...args);
  }
};

/**
 * 개발 전용 정보 로그
 */
export function devInfo(...args) {
  if (__DEV__) {
    console.info('[DEV INFO]', ...args);
  }
};

/**
 * 성능 로그 (개발 전용)
 */
export function perfLog(label, fn) {
  if (__DEV__) {
    console.time(label);
    const result = fn();
    console.timeEnd(label);
    return result;
  }
  return fn();
};

/**
 * 조건부 로그
 */
export function conditionalLog(condition, ...args) {
  if (__DEV__ && condition) {
    console.log('[CONDITIONAL]', ...args);
  }
};

/**
 * API 요청/응답 로그 (개발 전용)
 */
export function apiLog(method, url, data = null, response = null) {
  if (__DEV__) {
    console.group(`[API] ${method.toUpperCase()} ${url}`);
    if (data) console.log('Request:', data);
    if (response) console.log('Response:', response);
    console.groupEnd();
  }
};

/**
 * 프로덕션 에러 로깅 (외부 서비스용)
 */
export function productionError(error, context = 'Unknown') {
  if (!__DEV__) {
    // 프로덕션에서는 Sentry, Crashlytics 등으로 전송
    // crashlytics().recordError(error);
    // Sentry.captureException(error);
  } else {
    console.error(`[PROD ERROR - ${context}]`, error);
  }
};

/**
 * 사용자 액션 추적 (프로덕션용)
 */
export function trackEvent(eventName, properties = {}) {
  if (!__DEV__) {
    // 프로덕션에서는 Analytics 서비스로 전송
    // analytics().logEvent(eventName, properties);
  } else {
    console.log(`[TRACK] ${eventName}`, properties);
  }
};

// 기본 console 대체 함수들
export const logger = {
  log: devLog,
  error: devError,
  warn: devWarn,
  info: devInfo,
  perf: perfLog,
  api: apiLog,
  track: trackEvent,
  productionError
};