// Hermes 엔진 호환성을 위한 polyfill
// "property is not configurable" 오류 방지

// 안전한 console 정의
if (typeof console === 'undefined') {
  global.console = {
    log: function() {},
    warn: function() {},
    error: function() {},
    info: function() {},
    debug: function() {}
  };
}

// 전역 객체 보호
if (typeof global !== 'undefined') {
  // Object.defineProperty 오류 방지
  const originalDefineProperty = Object.defineProperty;
  if (typeof originalDefineProperty === 'function') {
    Object.defineProperty = function(obj, prop, descriptor) {
      try {
        return originalDefineProperty.call(this, obj, prop, descriptor);
      } catch (error) {
        if (error && error.message && error.message.includes('not configurable')) {
          // configurable 속성이 false인 경우 무시하고 계속 진행
          if (console && console.warn) {
            console.warn(`Property ${prop} is not configurable, skipping...`);
          }
          return obj;
        }
        throw error;
      }
    };
  }

  // Array.prototype 보호
  if (Array.prototype && typeof Array.prototype.map === 'function') {
    const originalMap = Array.prototype.map;
    try {
      Object.defineProperty(Array.prototype, 'map', {
        value: originalMap,
        writable: true,
        enumerable: false,
        configurable: true
      });
    } catch (e) {
      // 이미 정의된 경우 무시
    }
  }

  // useDebounce와 같은 함수들 보호
  if (typeof global.useDebounce !== 'undefined') {
    try {
      Object.defineProperty(global, 'useDebounce', {
        value: global.useDebounce,
        writable: true,
        enumerable: false,
        configurable: true
      });
    } catch (e) {
      // configurable이 false인 경우 무시
    }
  }

  // Promise 보호
  if (typeof Promise !== 'undefined' && Promise.prototype) {
    const originalThen = Promise.prototype.then;
    try {
      Object.defineProperty(Promise.prototype, 'then', {
        value: originalThen,
        writable: true,
        enumerable: false,
        configurable: true
      });
    } catch (e) {
      // 이미 정의된 경우 무시
    }
  }

  // console 객체 보호
  if (typeof console !== 'undefined' && console) {
    ['log', 'warn', 'error', 'info', 'debug'].forEach(function(method) {
      if (console[method] && typeof console[method] === 'function') {
        const originalMethod = console[method];
        try {
          Object.defineProperty(console, method, {
            value: originalMethod,
            writable: true,
            enumerable: false,
            configurable: true
          });
        } catch (e) {
          // 이미 정의된 경우 무시
        }
      }
    });
  }
}

// Hermes 특화 설정
if (typeof HermesInternal !== 'undefined') {
  // Hermes 내부 최적화 설정
  try {
    if (HermesInternal.hasPromise && !global.Promise) {
      global.Promise = HermesInternal.Promise;
    }
  } catch (e) {
    console.warn('Hermes Promise polyfill failed:', e);
  }
}

// logger 객체 안전성 보장
if (typeof global !== 'undefined') {
  try {
    // logger가 정의되지 않은 경우 기본 logger 제공
    if (typeof global.logger === 'undefined') {
      global.logger = {
        log: function(...args) { console.log('[LOG]', ...args); },
        error: function(...args) { console.error('[ERROR]', ...args); },
        warn: function(...args) { console.warn('[WARN]', ...args); },
        info: function(...args) { console.info('[INFO]', ...args); },
        perf: function(label, fn) { return fn(); },
        api: function(...args) { console.log('[API]', ...args); },
        track: function(...args) { console.log('[TRACK]', ...args); },
        productionError: function(...args) { console.error('[PROD ERROR]', ...args); }
      };
    }
  } catch (e) {
    // logger 정의 실패시 무시
  }
}

if (console && console.log) {
  console.log('Hermes polyfill loaded successfully');
}