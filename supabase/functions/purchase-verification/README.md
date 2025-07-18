# Purchase Verification Edge Function

Google Play 인앱결제 서버 검증을 위한 Supabase Edge Function입니다.

## 기능

- Google Play Developer API를 통한 구매 토큰 검증
- 검증 성공 시 사용자 프리미엄 상태 업데이트
- 구매 로그 기록 및 추적
- 보안을 위한 서버사이드 검증

## 환경 변수 설정

Supabase 대시보드에서 다음 환경 변수를 설정해야 합니다:

```
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----
GOOGLE_PLAY_ACCESS_TOKEN=(선택사항: 미리 생성된 액세스 토큰)
```

## Google Play Console 설정

1. Google Cloud Console에서 프로젝트 생성
2. Google Play Developer API 활성화
3. 서비스 계정 생성 및 키 다운로드
4. Google Play Console에서 서비스 계정에 권한 부여

## API 사용법

### POST /purchase-verification

구매 토큰을 검증하고 사용자 프리미엄 상태를 업데이트합니다.

**Request Body:**
```json
{
  "purchaseToken": "구매_토큰",
  "productId": "expertaccount",
  "userId": "사용자_UUID",
  "packageName": "com.arld.app"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Purchase verified and premium status updated",
  "data": {
    "userId": "사용자_UUID",
    "productId": "expertaccount",
    "orderId": "GPA.1234-5678-9012-34567",
    "purchaseTime": "2024-12-30T10:00:00.000Z",
    "expirationTime": "2025-01-30T10:00:00.000Z",
    "isPremium": true
  }
}
```

**Error Response (400/500):**
```json
{
  "error": "에러 메시지",
  "details": "상세 정보"
}
```

## 클라이언트 통합 예시

```typescript
import { supabase } from './supabase';

async function verifyPurchase(purchaseToken: string, userId: string) {
  try {
    const { data, error } = await supabase.functions.invoke('purchase-verification', {
      body: {
        purchaseToken,
        productId: 'expertaccount',
        userId,
        packageName: 'com.arld.app'
      }
    });

    if (error) {
      console.error('Purchase verification failed:', error);
      return false;
    }

    console.log('Purchase verified successfully:', data);
    return true;
  } catch (error) {
    console.error('Purchase verification error:', error);
    return false;
  }
}
```

## 데이터베이스 테이블

### user_profiles
- `is_premium`: 프리미엄 사용자 여부
- `premium_expires_at`: 프리미엄 만료일

### purchase_logs
- `user_id`: 사용자 ID
- `product_id`: 상품 ID
- `purchase_token`: 구매 토큰
- `order_id`: 주문 ID
- `purchase_time`: 구매 시간
- `expiration_time`: 만료 시간
- `verification_data`: 검증 데이터 (JSONB)

## 보안 고려사항

1. 모든 구매 검증은 서버에서 수행
2. 구매 토큰은 Google Play API로 직접 검증
3. RLS(Row Level Security) 정책 적용
4. 서비스 계정 키는 환경 변수로 안전하게 관리

## 배포

```bash
supabase functions deploy purchase-verification
```

## 로그 확인

```bash
supabase functions logs purchase-verification
```