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

// 차단할 실행파일 확장자
const BLOCKED_EXECUTABLE_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.psh', '.ps1',
  '.vbs', '.vbe', '.js', '.jse', '.jar', '.app', '.deb', '.rpm',
  '.msi', '.dmg', '.pkg', '.run', '.bin'
];

// 차단할 압축파일 확장자
const BLOCKED_ARCHIVE_EXTENSIONS = [
  '.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz', 
  '.cab', '.iso', '.dmg', '.sit', '.sitx'
];

// 파일 시그니처 (매직 넘버)
const FILE_SIGNATURES = {
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png': [0x89, 0x50, 0x4E, 0x47],
  'image/gif': [0x47, 0x49, 0x46],
  'image/webp': [0x52, 0x49, 0x46, 0x46],
  'application/pdf': [0x25, 0x50, 0x44, 0x46],
  'application/zip': [0x50, 0x4B, 0x03, 0x04],
  'application/x-msdownload': [0x4D, 0x5A] // .exe files
};

// 파일 크기 제한 (바이트)
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_DOCUMENT_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * 실행파일 확장자 차단 검사
 * @param {string} fileName - 파일명
 * @returns {Object} - 검증 결과 {isValid, error}
 */
function checkExecutableExtension(fileName) {
  if (!fileName) return { isValid: true, error: null };
  
  const lowerFileName = fileName.toLowerCase();
  const hasBlockedExtension = BLOCKED_EXECUTABLE_EXTENSIONS.some(function(ext) { 
    return lowerFileName.endsWith(ext);
  });
  
  if (hasBlockedExtension) {
    return {
      isValid: false,
      error: '실행파일은 업로드할 수 없습니다.'
    };
  }
  
  return { isValid: true, error: null };
}

/**
 * 압축파일 확장자 차단 검사
 * @param {string} fileName - 파일명
 * @returns {Object} - 검증 결과 {isValid, error}
 */
function checkArchiveExtension(fileName) {
  if (!fileName) return { isValid: true, error: null };
  
  const lowerFileName = fileName.toLowerCase();
  const hasBlockedExtension = BLOCKED_ARCHIVE_EXTENSIONS.some(function(ext) { 
    return lowerFileName.endsWith(ext);
  });
  
  if (hasBlockedExtension) {
    return {
      isValid: false,
      error: '압축파일은 업로드할 수 없습니다.'
    };
  }
  
  return { isValid: true, error: null };
}

/**
 * 파일 시그니처 검증
 * @param {ArrayBuffer} fileBuffer - 파일 버퍼
 * @param {string} expectedMimeType - 예상 MIME 타입
 * @returns {Object} - 검증 결과 {isValid, error}
 */
function checkFileSignature(fileBuffer, expectedMimeType) {
  if (!fileBuffer || !expectedMimeType) {
    return { isValid: true, error: null }; // 시그니처 체크 실패 시 통과
  }
  
  const signature = FILE_SIGNATURES[expectedMimeType];
  if (!signature) {
    return { isValid: true, error: null }; // 알려진 시그니처가 없으면 통과
  }
  
  const bytes = new Uint8Array(fileBuffer.slice(0, signature.length));
  
  for (let i = 0; i < signature.length; i++) {
    if (bytes[i] !== signature[i]) {
      return {
        isValid: false,
        error: '파일 형식이 확장자와 일치하지 않습니다.'
      };
    }
  }
  
  return { isValid: true, error: null };
}

/**
 * 이미지 파일 검증
 * @param {Object} file - 파일 객체
 * @returns {Object} - 검증 결과 {isValid, error}
 */
export function validateImageFile(file) {
  if (!file) {
    return { isValid: false, error: '파일이 선택되지 않았습니다.' };
  }

  // 파일명 가져오기
  const fileName = file.name || file.fileName || '';
  
  // 1. 실행파일 확장자 차단
  const executableCheck = checkExecutableExtension(fileName);
  if (!executableCheck.isValid) {
    return executableCheck;
  }
  
  // 2. 압축파일 확장자 차단
  const archiveCheck = checkArchiveExtension(fileName);
  if (!archiveCheck.isValid) {
    return archiveCheck;
  }

  // expo-image-picker는 uri만 제공하므로 파일 확장자로 검증
  const uri = file.uri || '';
  if (!uri) {
    return { isValid: false, error: '이미지 파일을 찾을 수 없습니다.' };
  }
  
  // URI에서 파일 확장자 추출 - 더 유연한 방식으로
  let ext = '';
  
  // 방법 1: 일반적인 파일 확장자 추출
  const match = uri.match(/\.([a-zA-Z]+)(?:[?#]|$)/);
  if (match) {
    ext = match[1].toLowerCase();
  } else {
    // 방법 2: expo 특수 URI 처리 (예: file:///.../.jpg)
    const parts = uri.split('/');
    const lastPart = parts[parts.length - 1];
    if (lastPart.includes('.')) {
      ext = lastPart.split('.').pop().split('?')[0].toLowerCase();
    }
  }
  
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif'];
  
  if (!ext || !imageExtensions.includes(ext)) {
    // 타입 검사로 폴백
    if (file.type && file.type.startsWith('image/')) {
      return { isValid: true, error: null };
    }
    
    return { 
      isValid: false, 
      error: '지원하지 않는 이미지 형식입니다. (JPG, PNG, GIF, WebP만 가능)' 
    };
  }

  // 3. 파일 시그니처 검증 (가능한 경우)
  if (file.arrayBuffer || file.buffer) {
    const buffer = file.arrayBuffer || file.buffer;
    const signatureCheck = checkFileSignature(buffer, file.type);
    if (!signatureCheck.isValid) {
      return signatureCheck;
    }
  }

  // expo-image-picker 결과에는 fileSize가 없으므로 크기 검증 스킵
  // 실제 업로드 시 서버에서 검증됨

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

  // 파일명 가져오기
  const fileName = file.fileName || file.name || '';
  
  // 1. 실행파일 확장자 차단
  const executableCheck = checkExecutableExtension(fileName);
  if (!executableCheck.isValid) {
    return executableCheck;
  }
  
  // 2. 압축파일 확장자 차단
  const archiveCheck = checkArchiveExtension(fileName);
  if (!archiveCheck.isValid) {
    return archiveCheck;
  }

  // 3. 파일 타입 검증
  const fileType = file.type || file.mimeType;
  if (!ALLOWED_DOCUMENT_TYPES.includes(fileType)) {
    return { 
      isValid: false, 
      error: '지원하지 않는 문서 형식입니다. (PDF, TXT, DOC, DOCX만 가능)' 
    };
  }

  // 4. 파일 크기 검증
  const fileSize = file.fileSize || file.size;
  if (fileSize && fileSize > MAX_DOCUMENT_SIZE) {
    return { 
      isValid: false, 
      error: `문서 크기가 너무 큽니다. (최대 ${MAX_DOCUMENT_SIZE / 1024 / 1024}MB)` 
    };
  }

  // 5. 파일 시그니처 검증 (가능한 경우)
  if (file.arrayBuffer || file.buffer) {
    const buffer = file.arrayBuffer || file.buffer;
    const signatureCheck = checkFileSignature(buffer, fileType);
    if (!signatureCheck.isValid) {
      return signatureCheck;
    }
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