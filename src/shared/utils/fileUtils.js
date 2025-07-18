/**
 * 파일 관련 유틸리티 함수들
 */

/**
 * 파일 크기를 읽기 쉬운 형태로 포맷
 * @param {number} bytes - 바이트 단위 파일 크기
 * @returns {string} 포맷된 파일 크기 문자열
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 파일 타입에 따른 아이콘 이름 반환
 * @param {string} mimeType - 파일의 MIME 타입
 * @returns {string} Ionicons 아이콘 이름
 */
export function getFileTypeIcon(mimeType) {
  if (!mimeType) return 'document-outline';
  
  if (mimeType.startsWith('image/')) {
    return 'image-outline';
  } else if (mimeType.startsWith('video/')) {
    return 'videocam-outline';
  } else if (mimeType.startsWith('audio/')) {
    return 'musical-notes-outline';
  } else if (mimeType.includes('pdf')) {
    return 'document-text-outline';
  } else if (mimeType.includes('word') || mimeType.includes('msword')) {
    return 'document-outline';
  } else if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
    return 'grid-outline';
  } else if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) {
    return 'easel-outline';
  } else if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) {
    return 'archive-outline';
  } else {
    return 'document-outline';
  }
}

/**
 * 파일 확장자 추출
 * @param {string} filename - 파일명
 * @returns {string} 파일 확장자 (소문자)
 */
export function getFileExtension(filename) {
  if (!filename) return '';
  return filename.split('.').pop().toLowerCase();
}

/**
 * 파일명에서 확장자 제거
 * @param {string} filename - 파일명
 * @returns {string} 확장자가 제거된 파일명
 */
export function getFileNameWithoutExtension(filename) {
  if (!filename) return '';
  const lastDotIndex = filename.lastIndexOf('.');
  return lastDotIndex === -1 ? filename : filename.substring(0, lastDotIndex);
}

/**
 * 안전한 파일명 생성 (특수문자 제거)
 * @param {string} filename - 원본 파일명
 * @returns {string} 안전한 파일명
 */
export function sanitizeFileName(filename) {
  if (!filename) return 'untitled';
  
  // 특수문자를 언더스코어로 치환
  return filename
    .replace(/[^a-zA-Z0-9가-힣._-]/g, '_')
    .replace(/_{2,}/g, '_') // 연속된 언더스코어 제거
    .replace(/^_|_$/g, ''); // 시작/끝 언더스코어 제거
}