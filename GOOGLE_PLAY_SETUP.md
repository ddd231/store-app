# Google Play Billing API 설정 가이드

## 🚀 완전한 Google Play 인앱결제 검증 시스템 구축 완료

### ✅ 구현된 기능
- **완전한 서버사이드 검증**: Google Play Developer API를 통한 실제 구매 검증
- **JWT 기반 인증**: Google Service Account를 사용한 보안 인증
- **구독/제품 구분**: 구독과 일회성 제품 모두 지원
- **자동 구매 승인**: acknowledgementState 확인 후 자동 승인 처리
- **구독 상태 관리**: 만료 확인, 갱신, 취소 등 전체 라이프사이클 관리
- **상세 로깅**: 모든 구매 과정 추적 및 오류 진단

## 🔑 Google Service Account 설정 방법

### 1. Google Cloud Console 설정
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 선택 또는 새 프로젝트 생성
3. **API 및 서비스** > **라이브러리** 이동
4. "Google Play Android Developer API" 검색 후 사용 설정

### 2. Service Account 생성
1. **IAM 및 관리** > **서비스 계정** 이동
2. **서비스 계정 만들기** 클릭
3. 서비스 계정 이름: `google-play-billing-verifier`
4. 역할: **프로젝트** > **편집자** 선택
5. **완료** 클릭

### 3. Service Account 키 생성
1. 생성된 서비스 계정 클릭
2. **키** 탭 > **키 추가** > **새 키 만들기**
3. **JSON** 선택 후 **만들기**
4. 다운로드된 JSON 파일 저장

### 4. Google Play Console 설정
1. [Google Play Console](https://play.google.com/console/) 접속
2. **설정** > **API 액세스** 이동
3. **새 서비스 계정 연결** 클릭
4. Service Account 이메일 입력
5. **권한 부여** > **재무 데이터** 액세스 권한 부여

## 🔧 Supabase 환경 변수 설정

### Edge Functions 환경 변수
```bash
# Supabase CLI로 환경 변수 설정
supabase secrets set GOOGLE_SERVICE_ACCOUNT_EMAIL="your-service-account@your-project.iam.gserviceaccount.com"
supabase secrets set GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----"
```

### JSON 파일에서 정보 추출
다운로드한 JSON 파일에서:
- `client_email` → `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `private_key` → `GOOGLE_PRIVATE_KEY`

## 📱 앱 설정

### Android build.gradle 설정
```gradle
dependencies {
    implementation 'com.android.billingclient:billing:6.1.0'
    // 2025년 기준 최신 버전 사용
}
```

### 제품 ID 설정
- **expertaccount**: 월간 구독 (₩3,000)
- **premium_monthly**: 월간 구독 
- **premium_yearly**: 연간 구독

## 🚀 배포 가이드

### 1. Edge Functions 배포
```bash
# verify-googleplaypay 함수 배포
supabase functions deploy verify-googleplaypay

# subscription-manager 함수 배포  
supabase functions deploy subscription-manager
```

### 2. 환경 변수 확인
```bash
# 환경 변수 목록 확인
supabase secrets list
```

### 3. 함수 테스트
```bash
# 구매 검증 테스트
curl -X POST 'https://your-project.supabase.co/functions/v1/verify-googleplaypay' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "purchaseToken": "test_token",
    "productId": "expertaccount", 
    "userId": "user_uuid"
  }'
```

## 🛡️ 보안 고려사항

### 1. Service Account 보안
- **Private Key 보안**: 절대 클라이언트에 노출 금지
- **최소 권한**: 필요한 권한만 부여
- **정기 키 교체**: 보안을 위해 정기적으로 키 교체

### 2. 구매 토큰 검증
- **중복 방지**: 동일한 purchase token 재사용 방지
- **만료 확인**: 구독 만료일 자동 확인
- **상태 추적**: 모든 구매 상태 로그 기록

### 3. 오류 처리
- **Graceful Degradation**: API 실패 시 적절한 오류 메시지
- **재시도 로직**: 일시적 오류에 대한 재시도
- **로깅**: 모든 검증 과정 상세 기록

## 📊 모니터링

### 구매 로그 조회
```sql
-- 최근 구매 내역
SELECT * FROM purchase_logs 
ORDER BY created_at DESC 
LIMIT 10;

-- 활성 구독 사용자
SELECT COUNT(*) FROM user_profiles 
WHERE is_premium = true 
AND premium_expires_at > now();

-- 만료 예정 구독
SELECT username, premium_expires_at 
FROM user_profiles 
WHERE is_premium = true 
AND premium_expires_at BETWEEN now() AND now() + INTERVAL '7 days';
```

### 구독 관리 API 사용
```javascript
// 만료된 구독 확인
const response = await supabase.functions.invoke('subscription-manager', {
  body: { action: 'check_expiry' }
});

// 사용자 구독 상태 조회
const userStatus = await supabase.functions.invoke('subscription-manager', {
  body: { action: 'get_status', userId: 'user_uuid' }
});
```

## 🎯 성과 및 개선사항

### ✅ 해결된 문제
- **임시 구독 활성화 제거**: 완전한 서버 검증으로 대체
- **중복 구매 방지**: 토큰 기반 중복 검증
- **자동 구매 승인**: 3일 내 자동 환불 방지
- **구독 라이프사이클 관리**: 갱신, 취소, 만료 자동 처리

### 🚀 추가된 기능
- **상세 구매 로그**: 모든 구매 과정 추적
- **만료 자동 관리**: 정기적인 만료 확인 및 처리
- **구독 상태 API**: 실시간 구독 상태 조회
- **오류 진단**: 상세한 오류 로그 및 디버깅 정보

## 🔄 다음 단계

1. **Google Play Console에서 테스트**: 샌드박스 환경에서 구매 테스트
2. **프로덕션 배포**: 실제 사용자 대상 배포
3. **모니터링 설정**: 구매 실패율, 구독 갱신율 등 지표 모니터링
4. **A/B 테스트**: 가격, 구독 기간 등 최적화

---

**⚠️ 중요**: Google Service Account 정보는 절대 공개하지 마세요. 서버 환경 변수로만 관리하세요.