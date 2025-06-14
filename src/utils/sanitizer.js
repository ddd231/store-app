/**
 * XSS 방어를 위한 입력값 필터링 유틸리티
 */

/**
 * 위험한 HTML 태그와 스크립트를 제거
 * @param {string} text - 필터링할 텍스트
 * @returns {string} - 안전한 텍스트
 */
export function sanitizeInput(text) {
  if (!text || typeof text !== 'string') return text;
  
  // 위험한 패턴들 제거
  return text
    // script 태그 제거
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // 이벤트 핸들러 제거 (onclick, onerror 등)
    .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
    // javascript: 프로토콜 제거
    .replace(/javascript:/gi, '')
    // HTML 태그 제거 (선택사항)
    .replace(/<[^>]+>/g, '')
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
  
  return text.replace(/[&<>"'/]/g, (char) => map[char]);
}