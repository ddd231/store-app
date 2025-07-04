/**
 * 유효성 검사 유틸리티 함수들
 */

/**
 * 이메일 유효성 검사
 */
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 비밀번호 강도 검사
 */
export function validatePassword(password) {
  if (password.length < 6) {
    return { valid: false, message: '비밀번호는 최소 6자 이상이어야 합니다.' };
  }
  
  // 추가 강도 검사 (선택사항)
  // const hasUpperCase = /[A-Z]/.test(password);
  // const hasLowerCase = /[a-z]/.test(password);
  // const hasNumbers = /\d/.test(password);
  // const hasSpecialChar = /[!@#$%^&*]/.test(password);
  
  return { valid: true };
}

/**
 * 사용자명 유효성 검사
 */
export function validateUsername(username) {
  if (username.length < 2) {
    return { valid: false, message: '사용자 이름은 최소 2자 이상이어야 합니다.' };
  }
  
  if (username.length > 30) {
    return { valid: false, message: '사용자 이름은 30자를 초과할 수 없습니다.' };
  }
  
  // 특수문자 제한 (선택사항)
  const usernameRegex = /^[a-zA-Z0-9_\-가-힣]+$/;
  if (!usernameRegex.test(username)) {
    return { valid: false, message: '사용자 이름은 영문, 숫자, 한글, -, _ 만 사용 가능합니다.' };
  }
  
  return { valid: true };
}

/**
 * URL 유효성 검사
 */
export function validateUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * 전화번호 유효성 검사
 */
export function validatePhoneNumber(phone) {
  const phoneRegex = /^(\+?82-?)?0?1[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * 파일 크기 검사
 */
export function validateFileSize(sizeInBytes, maxSizeInMB = 10) {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return sizeInBytes <= maxSizeInBytes;
}

/**
 * 이미지 파일 타입 검사
 */
export function validateImageType(mimeType) {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  return allowedTypes.includes(mimeType.toLowerCase());
}

/**
 * 텍스트 길이 검사
 */
export function validateTextLength(text, minLength = 0, maxLength = Infinity) {
  const length = text.trim().length;
  return length >= minLength && length <= maxLength;
}