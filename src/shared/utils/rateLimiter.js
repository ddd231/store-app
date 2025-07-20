/**
 * Rate Limiting 유틸리티
 * API 호출 빈도 제한으로 무차별 공격 방지
 */

// 각 기능별 Rate Limit 설정
const RATE_LIMITS = {
  login: { requests: 10, windowMs: 15 * 60 * 1000 }, // 15분에 10번
  signup: { requests: 4, windowMs: 60 * 60 * 1000 }, // 1시간에 4번
  resetPassword: { requests: 4, windowMs: 60 * 60 * 1000 }, // 1시간에 4번
  fileUpload: { requests: 10, windowMs: 10 * 60 * 1000 }, // 10분에 10번
  messagePost: { requests: 30, windowMs: 60 * 1000 }, // 1분에 30번
  messagePostDaily: { requests: 500, windowMs: 24 * 60 * 60 * 1000 }, // 하루에 500번
  jobPost: { requests: 5, windowMs: 24 * 60 * 60 * 1000 }, // 24시간에 5번
  contestPost: { requests: 2, windowMs: 24 * 60 * 60 * 1000 }, // 하루에 2번
  workUpload: { requests: 10, windowMs: 24 * 60 * 60 * 1000 }, // 하루에 10번
};

// 요청 기록 저장소 (메모리 기반)
const requestLog = new Map();

/**
 * Rate Limit 체크
 * @param {string} action - 액션 타입 (login, signup 등)
 * @param {string} identifier - 식별자 (IP, 사용자 ID 등)
 * @returns {Object} - { allowed: boolean, retryAfter?: number }
 */
export function checkRateLimit(action, identifier = 'anonymous') {
  const limit = RATE_LIMITS[action];
  if (!limit) {
    return { allowed: true };
  }

  const key = `${action}_${identifier}`;
  const now = Date.now();
  
  // 기존 기록 조회
  let records = requestLog.get(key) || [];
  
  // 시간 윈도우 밖의 기록 제거
  records = records.filter(function(timestamp) { return now - timestamp < limit.windowMs; });
  
  // 제한 초과 체크
  if (records.length >= limit.requests) {
    const oldestRequest = Math.min(...records);
    const retryAfter = Math.ceil((oldestRequest + limit.windowMs - now) / 1000);
    
    return { 
      allowed: false, 
      retryAfter,
      message: `너무 많은 요청을 보냈습니다. ${retryAfter}초 후 다시 시도해주세요.`
    };
  }
  
  // 새 요청 기록
  records.push(now);
  requestLog.set(key, records);
  
  return { allowed: true };
}

/**
 * Rate Limit 리셋 (테스트용)
 * @param {string} action - 액션 타입
 * @param {string} identifier - 식별자
 */
export function resetRateLimit(action, identifier = 'anonymous') {
  const key = `${action}_${identifier}`;
  requestLog.delete(key);
}

/**
 * 모든 Rate Limit 초기화
 */
export function clearAllRateLimits() {
  requestLog.clear();
}

/**
 * Rate Limit 데코레이터 함수
 * @param {string} action - 액션 타입
 * @param {Function} fn - 실행할 함수
 * @returns {Function} - Rate Limit이 적용된 함수
 */
export function withRateLimit(action, fn) {
  return async function(...args) {
    const identifier = this?.userId || this?.email || 'anonymous';
    const rateLimitResult = checkRateLimit(action, identifier);
    
    if (!rateLimitResult.allowed) {
      throw new Error(rateLimitResult.message);
    }
    
    return await fn.apply(this, args);
  };
}

// 편의 함수들
export const RateLimitedActions = {
  /**
   * 로그인 Rate Limit 체크
   * @param {string} email - 사용자 이메일
   * @returns {Object} - Rate Limit 결과
   */
  checkLogin(email) {
    return checkRateLimit('login', email);
  },

  /**
   * 회원가입 Rate Limit 체크
   * @param {string} email - 사용자 이메일
   * @returns {Object} - Rate Limit 결과
   */
  checkSignup(email) {
    return checkRateLimit('signup', email);
  },

  /**
   * 비밀번호 재설정 Rate Limit 체크
   * @param {string} email - 사용자 이메일
   * @returns {Object} - Rate Limit 결과
   */
  checkPasswordReset(email) {
    return checkRateLimit('resetPassword', email);
  },

  /**
   * 파일 업로드 Rate Limit 체크
   * @param {string} userId - 사용자 ID
   * @returns {Object} - Rate Limit 결과
   */
  checkFileUpload(userId) {
    return checkRateLimit('fileUpload', userId);
  },

  /**
   * 메시지 전송 Rate Limit 체크
   * @param {string} userId - 사용자 ID
   * @returns {Object} - Rate Limit 결과
   */
  checkMessagePost(userId) {
    return checkRateLimit('messagePost', userId);
  },

  /**
   * 채용공고 등록 Rate Limit 체크
   * @param {string} userId - 사용자 ID
   * @returns {Object} - Rate Limit 결과
   */
  checkJobPost(userId) {
    return checkRateLimit('jobPost', userId);
  },

  /**
   * 작품 업로드 Rate Limit 체크
   * @param {string} userId - 사용자 ID
   * @returns {Object} - Rate Limit 결과
   */
  checkWorkUpload(userId) {
    return checkRateLimit('workUpload', userId);
  },

  /**
   * 메시지 전송 일일 제한 체크
   * @param {string} userId - 사용자 ID
   * @returns {Object} - Rate Limit 결과
   */
  checkMessagePostDaily(userId) {
    return checkRateLimit('messagePostDaily', userId);
  },

  /**
   * 컨테스트 게시 Rate Limit 체크
   * @param {string} userId - 사용자 ID
   * @returns {Object} - Rate Limit 결과
   */
  checkContestPost(userId) {
    return checkRateLimit('contestPost', userId);
  }
};