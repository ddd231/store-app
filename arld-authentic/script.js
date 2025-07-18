// ARLD 로그인 인증 JavaScript

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const loginButton = document.getElementById('loginButton');
    const statusMessage = document.getElementById('statusMessage');
    const loadingSpinner = document.getElementById('loadingSpinner');
    
    // 데모 계정 정보
    const DEMO_ACCOUNTS = {
        'test@arld.app': 'test123',
        'admin@arld.app': 'admin123',
        'demo@arld.app': 'demo123'
    };
    
    // 로그인 폼 제출 처리
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        handleLogin();
    });
    
    // 로그인 처리 함수
    function handleLogin() {
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        
        // 기본 검증
        if (!validateEmail(email)) {
            showMessage('올바른 이메일 주소를 입력하세요.', 'error');
            return;
        }
        
        if (password.length < 6) {
            showMessage('비밀번호는 6자 이상이어야 합니다.', 'error');
            return;
        }
        
        // 로딩 상태 시작
        setLoading(true);
        
        // 시뮬레이션된 로그인 처리 (1.5초 후)
        setTimeout(function() {
            authenticateUser(email, password);
        }, 1500);
    }
    
    // 사용자 인증 함수
    function authenticateUser(email, password) {
        // 데모 계정 확인
        if (DEMO_ACCOUNTS[email] && DEMO_ACCOUNTS[email] === password) {
            // 로그인 성공
            setLoading(false);
            showMessage('로그인이 성공했습니다! 환영합니다.', 'success');
            
            // 성공 후 처리
            setTimeout(function() {
                handleLoginSuccess(email);
            }, 2000);
        } else {
            // 로그인 실패
            setLoading(false);
            showMessage('이메일 또는 비밀번호가 올바르지 않습니다.', 'error');
        }
    }
    
    // 로그인 성공 처리
    function handleLoginSuccess(email) {
        // 로컬 스토리지에 사용자 정보 저장
        localStorage.setItem('arld_user', JSON.stringify({
            email: email,
            loginTime: new Date().toISOString(),
            isAuthenticated: true
        }));
        
        // 딥링크 시도 (앱이 설치되어 있는 경우)
        tryDeepLink();
        
        // 성공 메시지 업데이트
        showMessage('인증이 완료되었습니다. 앱으로 이동 중...', 'success');
        
        // 3초 후 Google Play Store로 이동 (앱이 없는 경우)
        setTimeout(function() {
            window.open('https://play.google.com/store/apps/details?id=com.arld.app', '_blank');
        }, 3000);
    }
    
    // 딥링크 시도 함수
    function tryDeepLink() {
        // ARLD 앱 딥링크 시도
        const deepLinkUrl = 'arld://auth/login';
        
        // 딥링크 시도
        window.location.href = deepLinkUrl;
        
        // iOS에서 딥링크 실패 시 대체 방법
        if (isIOS()) {
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = deepLinkUrl;
            document.body.appendChild(iframe);
            
            setTimeout(function() {
                document.body.removeChild(iframe);
            }, 1000);
        }
    }
    
    // 로딩 상태 설정
    function setLoading(isLoading) {
        loginButton.disabled = isLoading;
        
        if (isLoading) {
            loginButton.classList.add('loading');
            loginButton.style.pointerEvents = 'none';
        } else {
            loginButton.classList.remove('loading');
            loginButton.style.pointerEvents = 'auto';
        }
    }
    
    // 메시지 표시 함수
    function showMessage(message, type) {
        statusMessage.textContent = message;
        statusMessage.className = `status-message ${type} show`;
        
        // 5초 후 메시지 숨기기
        setTimeout(function() {
            statusMessage.classList.remove('show');
        }, 5000);
    }
    
    // 이메일 유효성 검사
    function validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    // iOS 기기 확인
    function isIOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    }
    
    // 엔터키 처리
    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const activeElement = document.activeElement;
            if (activeElement && (activeElement.id === 'email' || activeElement.id === 'password')) {
                handleLogin();
            }
        }
    });
    
    // 입력 필드 포커스 효과
    const inputs = document.querySelectorAll('input');
    inputs.forEach(function(input) {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');
        });
    });
    
    // 페이지 로드 시 기존 인증 상태 확인
    checkExistingAuth();
    
    // 기존 인증 상태 확인 함수
    function checkExistingAuth() {
        const savedUser = localStorage.getItem('arld_user');
        if (savedUser) {
            try {
                const user = JSON.parse(savedUser);
                const loginTime = new Date(user.loginTime);
                const now = new Date();
                const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
                
                // 24시간 이내 로그인 기록이 있는 경우
                if (hoursDiff < 24 && user.isAuthenticated) {
                    showMessage('이미 로그인된 상태입니다.', 'success');
                    document.getElementById('email').value = user.email;
                }
            } catch (e) {
                // 저장된 데이터가 손상된 경우 삭제
                localStorage.removeItem('arld_user');
            }
        }
    }
    
    // 데모 계정 힌트 표시 (개발 모드에서만)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        const demoHint = document.createElement('div');
        demoHint.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px;
            border-radius: 5px;
            font-size: 12px;
            z-index: 1000;
        `;
        demoHint.innerHTML = `
            <strong>데모 계정:</strong><br>
            test@arld.app / test123<br>
            admin@arld.app / admin123
        `;
        document.body.appendChild(demoHint);
    }
});