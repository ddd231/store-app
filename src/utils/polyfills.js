/**
 * 폴리필 및 웹 호환성 관련 유틸리티 모듈
 * 웹 환경에서 필요한 폴리필과 호환성 처리를 관리
 */

/**
 * 필수 폴리필과 전역 객체 설정
 */
export function setupPolyfills() {
  if (typeof window === 'undefined') return;
  
  
  // 전역 네임스페이스에 필요한 객체 확실하게 설정
  if (typeof global === 'undefined') {
    window.global = window;
  }
  
  // Buffer 폴리필
  if (typeof Buffer === 'undefined') {
    try {
      // 참고: 실제 구현에서는 buffer 패키지 등을 사용해야 함
      window.Buffer = {
        from: (data) => {
          if (typeof data === 'string') {
            return Uint8Array.from(data.split('').map(c => c.charCodeAt(0)));
          }
          return new Uint8Array(data);
        },
        isBuffer: () => false
      };
    } catch (e) {
      console.error('[폴리필] Buffer 설정 실패:', e);
    }
  }
  
  // URL 및 URLSearchParams 폴리필 확인
  if (typeof URL === 'undefined' || typeof URLSearchParams === 'undefined') {
  }
  
  // Blob 폴리필 확인
  if (typeof Blob === 'undefined') {
  }
  
  // 로컬 스토리지 확인 및 폴리필 강화
  let localStorageAvailable = false;
  
  // 로컬스토리지 가용성 테스트
  try {
    // localStorage 정의 여부 확인
    if (typeof localStorage !== 'undefined') {
      // 실제 쓰기 테스트
      localStorage.setItem('__test', '1');
      localStorage.removeItem('__test');
      localStorageAvailable = true;
    } else {
    }
  } catch (e) {
  }
  
  // 메모리 기반 폴리필 제공 (사용할 수 없는 경우)
  if (!localStorageAvailable) {
    try {
      const memoryStorage = {};
      window.localStorage = {
        getItem: (key) => {
          try { return memoryStorage[key] || null; } 
          catch (e) { console.error('메모리 스토리지 getItem 오류:', e); return null; }
        },
        setItem: (key, value) => { 
          try { memoryStorage[key] = String(value); } 
          catch (e) { console.error('메모리 스토리지 setItem 오류:', e); }
        },
        removeItem: (key) => {
          try { delete memoryStorage[key]; } 
          catch (e) { console.error('메모리 스토리지 removeItem 오류:', e); }
        },
        clear: () => {
          try { Object.keys(memoryStorage).forEach(key => delete memoryStorage[key]); }
          catch (e) { console.error('메모리 스토리지 clear 오류:', e); }
        },
        key: (index) => {
          try { return Object.keys(memoryStorage)[index] || null; }
          catch (e) { console.error('메모리 스토리지 key 오류:', e); return null; }
        },
        get length() {
          try { return Object.keys(memoryStorage).length; }
          catch (e) { console.error('메모리 스토리지 length 오류:', e); return 0; }
        }
      };
    } catch (e) {
      console.error('[폴리필] 메모리 기반 localStorage 폴리필 설정 실패:', e);
    }
  }
  
}

/**
 * 오류 보고 및 로깅 설정
 */
export function setupErrorHandling() {
  if (typeof window === 'undefined') return;
  
  
  // 전역 오류 처리 핸들러
  window.onerror = function(message, source, lineno, colno, error) {
    console.error('[전역 오류]', {
      message,
      source,
      lineno,
      colno,
      error: error ? error.stack || error.message : null
    });
    
    // 오류 UI 표시
    try {
      const errorContainer = document.getElementById('error-container');
      if (errorContainer) {
        errorContainer.style.display = 'block';
        
        const errorMessage = document.getElementById('error-message');
        if (errorMessage) {
          errorMessage.innerText = message;
        }
      }
    } catch (e) {
      // UI 업데이트 오류는 무시
    }
    
    // 기본 오류 처리 허용
    return false;
  };
  
  // 처리되지 않은 프로미스 오류 처리
  window.onunhandledrejection = function(event) {
    console.error('[처리되지 않은 프로미스 오류]', event.reason);
    
    // 오류 UI 표시
    try {
      const errorContainer = document.getElementById('error-container');
      if (errorContainer) {
        errorContainer.style.display = 'block';
        
        const errorMessage = document.getElementById('error-message');
        if (errorMessage) {
          errorMessage.innerText = '비동기 작업 오류: ' + 
            (event.reason ? (event.reason.message || '알 수 없는 오류') : '알 수 없는 오류');
        }
      }
    } catch (e) {
      // UI 업데이트 오류는 무시
    }
  };
  
}

export default {
  setupPolyfills,
  setupErrorHandling
};
