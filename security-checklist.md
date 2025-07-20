# 🔐 보안 체크리스트 - 즉시 조치사항

## 🚨 즉시 필요한 조치사항 (CRITICAL)

### 1. Supabase 키 로테이션
- [ ] **Supabase 대시보드 접속**: https://app.supabase.com/project/zudnmkyedvhdgftbwatt/settings/api
- [ ] **새로운 프로젝트 생성** (권장): 완전한 보안을 위해 새 프로젝트 생성
- [ ] **또는 기존 프로젝트 리셋**: 데이터베이스 리셋 및 새 키 생성
- [ ] **새로운 anon key 확인**: 새로 생성된 anon key 기록
- [ ] **새로운 service role key 확인**: 새로 생성된 service role key 기록

### 2. Google 서비스 계정 재생성
- [ ] **Google Cloud Console 접속**: https://console.cloud.google.com/
- [ ] **기존 서비스 계정 삭제**: `arldgoogleplayverifier@western-voyage-464507-g7.iam.gserviceaccount.com`
- [ ] **새로운 서비스 계정 생성**: Google Play API 권한 부여
- [ ] **새로운 개인 키 생성**: JSON 형식으로 다운로드
- [ ] **키 파일 보안 저장**: 안전한 위치에 저장

### 3. EAS 시크릿 설정
```bash
# 1. 프로젝트 디렉토리로 이동
cd /mnt/c/Users/god/main-project/react-app-web

# 2. EAS CLI 설치 (필요한 경우)
npm install -g eas-cli

# 3. EAS 로그인
eas login

# 4. 시크릿 설정 스크립트 실행
./setup-eas-secrets.sh
```

### 4. 환경변수 파일 보안
- [ ] **현재 .env 파일 백업**: 안전한 위치에 보관
- [ ] **프로덕션 .env 파일 삭제**: 민감한 정보 제거
- [ ] **새로운 .env.example 업데이트**: 템플릿 파일만 유지

## 🔧 추가 보안 강화 사항

### 1. 데이터베이스 보안
- [ ] **Row Level Security 정책 검토**: 모든 테이블 RLS 활성화 확인
- [ ] **사용자 권한 검토**: 불필요한 권한 제거
- [ ] **함수 보안 검토**: SECURITY DEFINER 함수 점검

### 2. 파일 업로드 보안
- [ ] **서버사이드 검증 구현**: Edge Function으로 파일 검증
- [ ] **멀웨어 스캔 추가**: 업로드 파일 보안 스캔
- [ ] **스토리지 권한 강화**: 퍼블릭 접근 제한

### 3. API 보안
- [ ] **Rate Limiting 강화**: 지속적인 rate limiting 구현
- [ ] **CORS 설정**: 허용된 도메인만 접근
- [ ] **API 키 관리**: 정기적인 키 로테이션 계획

## 📋 확인 단계

### 1. 설정 확인
```bash
# EAS 시크릿 확인
eas secret:list

# 빌드 테스트
eas build --platform android --profile preview --no-wait
```

### 2. 보안 테스트
- [ ] **로그인 기능 테스트**: 새로운 키로 인증 확인
- [ ] **파일 업로드 테스트**: 보안 검증 확인
- [ ] **API 호출 테스트**: 모든 기능 정상 작동 확인

### 3. 모니터링 설정
- [ ] **로그 모니터링**: 비정상적인 접근 감지
- [ ] **에러 추적**: 보안 관련 에러 모니터링
- [ ] **성능 모니터링**: 과도한 리소스 사용 감지

## 🚀 완료 후 체크리스트

- [ ] 모든 하드코딩된 키 제거됨
- [ ] EAS 시크릿 설정 완료
- [ ] 새로운 Supabase 키로 교체 완료
- [ ] Google 서비스 계정 재생성 완료
- [ ] 빌드 및 배포 테스트 완료
- [ ] 모든 기능 정상 작동 확인
- [ ] 보안 모니터링 설정 완료

## 📞 문제 발생 시 연락처

- Supabase 지원: https://supabase.com/support
- Google Cloud 지원: https://cloud.google.com/support
- Expo 지원: https://expo.dev/support

---

**⚠️ 중요**: 이 모든 작업은 가능한 한 빨리 수행해야 합니다. 노출된 키들은 즉시 보안 위험이 될 수 있습니다.