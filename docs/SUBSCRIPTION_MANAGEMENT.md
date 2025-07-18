# 구독 관리 시스템

## 📋 개요

이 시스템은 ARLD 앱의 프리미엄 구독을 자동으로 관리합니다.

## 🚀 주요 기능

### 1. 자동 만료 처리
- 매일 만료된 구독을 자동으로 감지하고 비활성화
- 사용자의 `is_premium` 상태를 `false`로 변경
- 관련 구매 로그도 비활성화

### 2. 실시간 권한 체크
- 앱에서 기능 접근 시 만료일까지 실시간 확인
- 만료된 구독 감지 시 즉시 서버 업데이트

### 3. 상세한 구독 정보
- 남은 일수 계산
- 구독 상태 추적
- 구매 히스토리 관리

## 🔧 구현된 Edge Functions

### 1. `subscription-manager`
**위치:** `/supabase/functions/subscription-manager/index.ts`

**지원 작업:**
- `check_expiry`: 만료된 구독 확인 및 비활성화
- `get_status`: 사용자 구독 상태 조회
- `renew_subscription`: 구독 갱신
- `cancel_subscription`: 구독 취소

### 2. `schedule-subscription-check`
**위치:** `/supabase/functions/schedule-subscription-check/index.ts`

**용도:** Cron job으로 실행될 예약된 만료 체크

## 📱 클라이언트 통합

### 1. 유틸리티 함수
**위치:** `/src/shared/utils/premiumUtils.js`

```javascript
import { checkPremiumAccess } from '../shared/utils/premiumUtils';

// 사용 예시
const accessResult = await checkPremiumAccess(userId);
if (accessResult.isPremium || accessResult.isAdmin) {
  // 프리미엄 기능 허용
} else {
  // 업그레이드 페이지로 이동
}
```

### 2. 자동 실행
- 앱 시작 시 자동으로 만료 체크 실행
- 모든 권한 체크에서 실시간 만료일 확인

## ⚙️ Cron Job 설정

### GitHub Actions (권장)
`.github/workflows/subscription-check.yml` 생성:

```yaml
name: Subscription Check
on:
  schedule:
    - cron: '0 1 * * *'  # 매일 오전 1시 (UTC)
  workflow_dispatch:

jobs:
  check-subscriptions:
    runs-on: ubuntu-latest
    steps:
      - name: Check Expired Subscriptions
        run: |
          curl -X POST \\
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}" \\
            -H "Content-Type: application/json" \\
            "${{ secrets.SUPABASE_URL }}/functions/v1/schedule-subscription-check"
```

### Supabase Cron (대안)
Supabase Database에서 pg_cron 확장 사용:

```sql
-- 매일 오전 1시에 실행
SELECT cron.schedule(
  'check-expired-subscriptions',
  '0 1 * * *',
  'SELECT net.http_post(
    url := ''YOUR_SUPABASE_URL/functions/v1/schedule-subscription-check'',
    headers := jsonb_build_object(''Authorization'', ''Bearer YOUR_SERVICE_KEY'')
  );'
);
```

### 서드파티 서비스
- **EasyCron**
- **Cron-job.org**
- **AWS CloudWatch Events**

URL: `YOUR_SUPABASE_URL/functions/v1/schedule-subscription-check`

## 🔍 모니터링

### 로그 확인
```bash
# Supabase CLI를 통한 로그 확인
supabase functions logs subscription-manager
supabase functions logs schedule-subscription-check
```

### 수동 실행
```javascript
// 만료 체크 수동 실행
const { data, error } = await supabase.functions.invoke('subscription-manager', {
  body: { action: 'check_expiry' }
});

// 특정 사용자 상태 확인
const { data, error } = await supabase.functions.invoke('subscription-manager', {
  body: { 
    action: 'get_status',
    userId: 'user-id-here'
  }
});
```

## 🛠️ 테스트

### 만료 테스트
1. 테스트 사용자의 `premium_expires_at`을 과거 날짜로 설정
2. Edge Function 실행
3. `is_premium`이 `false`로 변경되는지 확인

### 권한 체크 테스트
1. 앱에서 프리미엄 기능 접근 시도
2. 만료된 사용자는 업그레이드 페이지로 이동하는지 확인
3. 유효한 사용자는 기능에 접근할 수 있는지 확인

## 🚨 주의사항

1. **환경 변수 설정 필수**
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

2. **보안**
   - Service Role Key는 절대 클라이언트에 노출하지 말 것
   - Edge Functions에서만 사용

3. **성능**
   - 대량 사용자 처리 시 배치 크기 조정 필요
   - 너무 자주 실행하지 말 것 (하루 1-2회 권장)

## 🎯 다음 단계

1. **알림 시스템**: 만료 예정 사용자에게 미리 알림
2. **분석**: 구독 패턴 분석 및 리포트
3. **자동 갱신**: 결제 실패 시 재시도 로직
4. **웹훅**: 실시간 결제 상태 업데이트