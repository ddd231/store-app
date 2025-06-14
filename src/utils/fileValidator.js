/**
 * 파일 업로드 보안 검증 유틸리티
 */

// 허용된 이미지 타입
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp'
];

// 허용된 문서 타입
const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

// 파일 크기 제한 (바이트)
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_DOCUMENT_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * 이미지 파일 검증
 * @param {Object} file - 파일 객체
 * @returns {Object} - 검증 결과 {isValid, error}
 */
export function validateImageFile(file) {
  if (!file) {
    return { isValid: false, error: '파일이 선택되지 않았습니다.' };
  }

  // 파일 타입 검증
  const fileType = file.type || file.mimeType;
  if (!ALLOWED_IMAGE_TYPES.includes(fileType)) {
    return { 
      isValid: false, 
      error: '지원하지 않는 이미지 형식입니다. (JPG, PNG, GIF, WebP만 가능)' 
    };
  }

  // 파일 크기 검증
  const fileSize = file.fileSize || file.size;
  if (fileSize && fileSize > MAX_IMAGE_SIZE) {
    return { 
      isValid: false, 
      error: `이미지 크기가 너무 큽니다. (최대 ${MAX_IMAGE_SIZE / 1024 / 1024}MB)` 
    };
  }

  // 파일명 검증 (위험한 확장자 체크)
  const fileName = file.fileName || file.name || '';
  const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.js', '.php'];
  const hasDangerousExt = dangerousExtensions.some(ext => 
    fileName.toLowerCase().includes(ext)
  );
  
  if (hasDangerousExt) {
    return { 
      isValid: false, 
      error: '업로드할 수 없는 파일입니다.' 
    };
  }

  return { isValid: true, error: null };
}

/**
 * 문서 파일 검증
 * @param {Object} file - 파일 객체
 * @returns {Object} - 검증 결과 {isValid, error}
 */
export function validateDocumentFile(file) {
  if (!file) {
    return { isValid: false, error: '파일이 선택되지 않았습니다.' };
  }

  // 파일 타입 검증
  const fileType = file.type || file.mimeType;
  if (!ALLOWED_DOCUMENT_TYPES.includes(fileType)) {
    return { 
      isValid: false, 
      error: '지원하지 않는 문서 형식입니다. (PDF, TXT, DOC, DOCX만 가능)' 
    };
  }

  // 파일 크기 검증
  const fileSize = file.fileSize || file.size;
  if (fileSize && fileSize > MAX_DOCUMENT_SIZE) {
    return { 
      isValid: false, 
      error: `문서 크기가 너무 큽니다. (최대 ${MAX_DOCUMENT_SIZE / 1024 / 1024}MB)` 
    };
  }

  // 파일명 검증
  const fileName = file.fileName || file.name || '';
  const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.js', '.php'];
  const hasDangerousExt = dangerousExtensions.some(ext => 
    fileName.toLowerCase().includes(ext)
  );
  
  if (hasDangerousExt) {
    return { 
      isValid: false, 
      error: '업로드할 수 없는 파일입니다.' 
    };
  }

  return { isValid: true, error: null };
}

/**
 * 파일명 안전하게 만들기
 * @param {string} fileName - 원본 파일명
 * @returns {string} - 안전한 파일명
 */
export function sanitizeFileName(fileName) {
  if (!fileName) return 'unnamed_file';
  
  // 위험한 문자들 제거 또는 대체
  return fileName
    .replace(/[<>:"/\\|?*]/g, '_') // Windows 금지 문자
    .replace(/\s+/g, '_') // 공백을 언더스코어로
    .replace(/[^\w\-_.]/g, '') // 영숫자, 하이픈, 언더스코어, 점만 허용
    .substring(0, 100); // 길이 제한
}