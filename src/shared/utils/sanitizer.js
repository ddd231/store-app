/**
 * XSS 방어를 위한 입력값 필터링 유틸리티
 */

/**
 * 강화된 XSS 방어를 위한 입력값 필터링
 * @param {string} text - 필터링할 텍스트
 * @returns {string} - 안전한 텍스트
 */
export function sanitizeInput(text) {
  if (!text || typeof text !== 'string') return text;
  
  // 위험한 패턴들 제거
  return text
    // script 태그 제거 (다양한 변형 포함)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<\s*script/gi, '')
    // style 태그 제거 (CSS injection 방지)
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    // 이벤트 핸들러 제거 (모든 on* 이벤트)
    .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/\s*on\w+\s*=\s*[^"'\s>]+/gi, '')
    // javascript: 프로토콜 제거 (대소문자 구분 없이)
    .replace(/javascript:/gi, '')
    .replace(/j\s*a\s*v\s*a\s*s\s*c\s*r\s*i\s*p\s*t\s*:/gi, '')
    // data: URL 제거 (Base64 인코딩된 스크립트 방지)
    .replace(/data:\s*text\/html/gi, '')
    // vbscript: 프로토콜 제거
    .replace(/vbscript:/gi, '')
    // 위험한 태그들 제거
    .replace(/<(iframe|object|embed|form|input|link|meta|base)[^>]*>/gi, '')
    // HTML 태그 제거
    .replace(/<[^>]+>/g, '')
    // HTML 엔티티 디코딩 공격 방지
    .replace(/&[#\w]+;/g, '')
    // SQL injection 패턴 제거
    .replace(/(union|select|insert|update|delete|drop|create|alter|exec|execute)\s/gi, '')
    // 여러 공백을 하나로
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 특수문자만 이스케이프 (HTML 태그는 유지하고 싶을 때)
 * @param {string} text - 이스케이프할 텍스트
 * @returns {string} - 이스케이프된 텍스트
 */
export function escapeHtml(text) {
  if (!text || typeof text !== 'string') return text;
  
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    "/": '&#x2F;',
  };
  
  return text.replace(/[&<>"'/]/g, function(char) { return map[char]; });
}