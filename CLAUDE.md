# ARLD 프로젝트 개발 가이드

## 📱 프로젝트 개요
**ARLD**는 예술가들을 위한 포트폴리오 & 채팅 플랫폼입니다.

### 핵심 정보
- **프로젝트명**: ARLD (Arld)
- **플랫폼**: React Native (Expo SDK 53)
- **백엔드**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **수익화**: Google AdMob, 프리미엄 기능 (Google Play 결제)
- **배포**: Google Play Store, 웹 배포 지원

### 기술 스택
```
Frontend: React Native 0.79.5, Expo 53.0.16, React Navigation 7.x
Backend: Supabase (PostgreSQL, Auth, Storage, Realtime)
State: Zustand + React Query (@tanstack/react-query)
Build: EAS Build, Metro bundler
Payment: react-native-iap, Google Play Billing
Ads: react-native-google-mobile-ads
```

## 🏗️ 프로젝트 구조

### 루트 디렉토리
```
react-app-web/
├── src/                    # 메인 소스 코드
├── supabase/              # Supabase 설정 및 Edge Functions
├── assets/                # 이미지, 아이콘 리소스
├── android/               # Android 네이티브 코드
├── public/                # 웹 배포용 정적 파일
├── docs/                  # 프로젝트 문서
├── app.json               # Expo 설정
├── package.json           # 의존성 관리
├── eas.json               # EAS Build 설정
└── tsconfig.json          # TypeScript 설정
```

### 소스 코드 구조 (src/)
```
src/
├── features/              # 🎯 기능별 모듈 (Feature-Based Architecture)
│   ├── auth/             # 인증 (로그인, 회원가입, 비밀번호 재설정)
│   ├── chat/             # 채팅 (실시간 메시징, 파일 전송, 친구 시스템)
│   ├── profile/          # 프로필 (사용자 정보, 편집, 갤러리)
│   ├── works/            # 작품 (홈 피드, 업로드, 상세보기)
│   ├── premium/          # 프리미엄 (결제, 북마크, 업그레이드)
│   ├── blog/             # 블로그 게시판
│   ├── contest/          # 컨테스트 정보
│   ├── gallery/          # 갤러리 관리
│   └── job/              # 채용 공고
├── shared/               # 🔧 공통 모듈
│   ├── components/       # 재사용 가능한 UI 컴포넌트
│   ├── hooks/           # 공통 커스텀 훅
│   ├── services/        # API 서비스, Supabase 클라이언트
│   ├── utils/           # 유틸리티 함수들
│   └── types/           # TypeScript 타입 정의
├── store/               # 🗃️ Zustand 전역 상태 관리
├── navigation/          # 🧭 React Navigation 설정
├── styles/              # 🎨 테마 및 스타일 시스템
├── locales/             # 🌐 다국어 지원 (한국어, 영어, 일본어)
├── screens/             # 📱 기타 화면들 (점진적으로 features로 이동)
├── services/            # 🔧 레거시 서비스 (점진적으로 shared로 이동)
└── contexts/            # ⚛️ React Context (다국어 등 특수 목적용)
```

## 🎯 Features 모듈 구조

### 공통 Features 구조
```
features/[feature-name]/
├── components/          # 해당 기능 전용 컴포넌트
├── hooks/              # 해당 기능 전용 훅
├── screens/            # 해당 기능의 화면들
├── services/           # 해당 기능의 API 서비스
├── types/              # TypeScript 타입 정의
├── styles/             # 해당 기능 전용 스타일 (선택사항)
└── index.js            # 📦 Barrel Export (통합 내보내기)
```

### 주요 Features 설명

#### 1. auth/ - 인증 시스템
- **화면**: LoginScreen, PasswordResetScreen
- **컴포넌트**: LoginForm, SignupForm, SignupCheckboxes
- **훅**: useAuth, useLoginLogic
- **특징**: 이메일/비밀번호 인증, 24시간 계정 삭제 유예

#### 2. chat/ - 실시간 채팅
- **화면**: ChatScreen, ChatListScreen, SelectFriendForChatScreen
- **컴포넌트**: MessageItem, ChatHeader, ChatInputBar
- **훅**: useChatAuth, useChatRealtime, useChatMessages
- **특징**: Supabase Realtime, 파일 전송, 답장 기능

#### 3. profile/ - 사용자 프로필
- **화면**: ProfileScreen, ProfileEditScreen, FriendsListScreen
- **컴포넌트**: ProfileHeader, ProfileTabs, ProfileGallery
- **훅**: useProfile, useProfileActions
- **특징**: 포트폴리오/INFO/갤러리 탭 구조

#### 4. works/ - 작품 관리
- **화면**: HomeScreen, WorkDetailScreen, WorkUploadScreen
- **컴포넌트**: ArtworkGrid, CategoryTabs, FilterModal
- **훅**: useHomeData, useHomeSearch, useWorksQuery
- **특징**: 그림/소설 업로드, 카테고리 필터링

#### 5. premium/ - 프리미엄 기능
- **화면**: UpgradeScreen, BookmarksScreen
- **서비스**: purchaseVerification.ts
- **특징**: Google Play 결제, 자동 구독 관리

## 🔧 Shared 모듈 구조

### components/ - 공통 컴포넌트
- **Button.js**: 통일된 버튼 컴포넌트 (4가지 variant)
- **Header.js**: 공통 헤더 컴포넌트
- **LoadingSpinner.js**: 로딩 인디케이터
- **WorkCard.js**: 작품 카드 (성능 최적화 적용)
- **EmptyState.js**: 빈 상태 표시 컴포넌트

### hooks/ - 공통 훅
- **useDebounce.js**: 검색 디바운싱 (500ms)
- **useOptimized.js**: 성능 최적화 훅
- **useRateLimit.js**: API 호출 제한

### services/ - 공통 서비스
```
services/
├── supabase/          # Supabase 관련 서비스
│   ├── client.js      # Supabase 클라이언트 초기화
│   ├── auth.js        # 인증 서비스
│   ├── chat.js        # 채팅 서비스
│   └── storage.js     # 파일 스토리지 서비스
├── api.js             # 일반 API 서비스
└── queryClient.js     # React Query 설정
```

### utils/ - 유틸리티 함수
- **adminUtils.js**: 관리자 권한 체크
- **fileValidator.js**: 파일 업로드 보안 검증
- **logger.js**: 로깅 시스템
- **sanitizer.js**: XSS 방어 필터링
- **validation.js**: 폼 검증 함수들

## 🎨 디자인 시스템

### 색상 테마 (styles/theme.js)
```javascript
colors: {
  primary: '#00BFFF',      // 진한 하늘색 (Deep Sky Blue)
  secondary: '#5856D6',    // 보라색
  background: '#F5F1E8',   // 연한 베이지
  surface: '#F2F2F7',     // 연한 회색
  text: {
    primary: '#000000',    // 검은색
    secondary: '#000000',  // 검은색
    placeholder: '#C7C7CC' // 연한 회색
  }
}
```

### 타이포그래피
- **title**: 34px, bold (대제목)
- **heading**: 28px, 600 (제목)
- **body**: 17px, 400 (본문)
- **caption**: 13px, 400 (설명)

## 🔄 상태 관리

### Zustand Store (store/)
```javascript
// authStore.js - 인증 상태 관리
const useAuthStore = create((set) => ({
  currentUser: null,
  isAuthenticated: false,
  loading: false,
  // ... 액션들
}));
```

### React Query 패턴
```javascript
// useWorksQuery.js - 작품 데이터 관리
const useWorksQuery = () => {
  return useQuery({
    queryKey: ['works'],
    queryFn: fetchWorks,
    staleTime: 5 * 60 * 1000, // 5분
  });
};
```

## 📐 개발 규칙 및 컨벤션

### 1. 함수 스타일
**❌ 금지: 화살표 함수**
```javascript
// 사용 금지
const Component = () => {}
const handleClick = () => {}
```

**✅ 권장: 일반 함수**
```javascript
// 사용 권장
function Component() {}
function handleClick() {}
export default function Component() {}
```

### 2. 컴포넌트 최적화
**필수 적용:**
- `React.memo()` - 불필요한 리렌더링 방지
- `useCallback()` - 함수 메모이제이션
- `useMemo()` - 연산 결과 캐싱

```javascript
export default React.memo(function Component({ data }) {
  const memoizedValue = useMemo(function() {
    return processData(data);
  }, [data]);
  
  const handleClick = useCallback(function() {
    // 이벤트 핸들러
  }, []);
  
  return <div>{memoizedValue}</div>;
});
```

### 3. 파일 명명 규칙
- **컴포넌트**: PascalCase (`LoginScreen.js`, `WorkCard.js`)
- **훅**: camelCase (`useAuth.js`, `useProfile.js`)
- **서비스**: camelCase (`authService.js`, `workService.js`)
- **유틸리티**: camelCase (`adminUtils.js`, `fileValidator.js`)

### 4. Import/Export 패턴
**Barrel Exports 사용:**
```javascript
// features/auth/index.js
export { default as LoginScreen } from './screens/LoginScreen';
export { useAuth } from './hooks/useAuth';

// 사용
import { LoginScreen, useAuth } from '../features/auth';
```

### 5. 성능 최적화
**FlatList 최적화:**
```javascript
<FlatList
  data={data}
  renderItem={renderItem}
  keyExtractor={keyExtractor}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  updateCellsBatchingPeriod={50}
  initialNumToRender={8}
  windowSize={21}
/>
```

## 🔐 보안 및 권한

### 사용자 권한 레벨
- **관리자**: `email === 'lsg5235@gmail.com'` 또는 `user_metadata.role === 'admin'`
- **프리미엄**: 조회 기록, 북마크 전용 기능
- **일반**: 기본 기능 (작품 업로드, 채팅 등)

### 파일 업로드 보안
- **허용 형식**: JPEG, PNG, GIF, WebP, PDF
- **금지 형식**: 실행파일, 압축파일, 스크립트
- **용량 제한**: 이미지 10MB, 문서 5MB
- **시그니처 검증**: 파일 헤더 검증으로 확장자 위조 방지

### Rate Limiting
```javascript
// 제한 사항
로그인: 15분/10회
회원가입: 1시간/4회
메시지 전송: 1분/30개, 하루/500개
작품 업로드: 하루/15개
파일 업로드: 10분/10회
```

## 📱 다국어 지원

### 지원 언어
- **한국어** (ko.js) - 기본 언어
- **영어** (en.js)
- **일본어** (ja.js)

### 사용법
```javascript
import { useLanguage } from '../contexts/LanguageContext';

function Component() {
  const { t } = useLanguage();
  return <Text>{t('welcome')}</Text>;
}
```

## 🛠️ 개발 도구 및 명령어

### 개발 서버
```bash
npm start                # Expo 개발 서버
npm run web             # 웹 개발 서버
npm run android         # Android 시뮬레이터
npm run ios             # iOS 시뮬레이터
```

### 빌드 및 배포
```bash
npm run build                              # 웹 빌드
npx eas-cli@latest build -p android       # Android 빌드
npx eas-cli@latest build -p ios           # iOS 빌드
```

### 테스트 계정
```
이메일: test@arld.app
비밀번호: test123
```

## 🔌 Supabase 설정

### 주요 테이블
- **user_profiles**: 사용자 프로필 정보
- **works**: 작품 데이터 (그림/소설)
- **messages**: 채팅 메시지
- **chat_rooms**: 채팅방 정보
- **friends**: 친구 관계
- **purchase_logs**: 결제 기록
- **galleries**: 갤러리 데이터

### Edge Functions
- **verify-googleplaypay**: Google Play 결제 검증
- **subscription-manager**: 구독 관리
- **subscription-sync**: 구독 동기화
- **delete-user**: 사용자 계정 삭제

## ⚠️ 중요 제약사항

### 1. Hermes 엔진 호환성
- 화살표 함수 사용 금지 (property is not configurable 오류 방지)
- 일반 함수 사용 필수

### 2. Google Play 정책 준수
- 앱 이름 일관성: "Arld" 사용
- 패키지명: `com.arld.app`
- 권한: 최소 필요 권한만 요청

### 3. 성능 최적화
- React.memo, useCallback 필수 적용
- FlatList 최적화 설정 필수
- 검색 디바운싱 적용

### 4. 보안 강화
- 파일 업로드 시 시그니처 검증
- Rate limiting 적용
- XSS 방어 필터링

## 🎯 현재 구현 상태

### ✅ 완료된 기능
- [x] 인증 시스템 (로그인, 회원가입, 비밀번호 재설정)
- [x] 실시간 채팅 (Supabase Realtime)
- [x] 프로필 관리 (편집, 갤러리)
- [x] 작품 업로드 및 관리
- [x] Google Play 결제 시스템
- [x] 자동 구독 관리 시스템
- [x] 계정 삭제 시스템 (24시간 유예)
- [x] 다국어 지원
- [x] AdMob 광고 통합
- [x] 친구 시스템
- [x] 북마크 기능
- [x] 게시판 시스템 (블로그, 컨테스트, 채용)

### 🚧 개선 필요 사항
- [ ] 일부 screens/ 파일들을 features/로 이동
- [ ] TypeScript 마이그레이션 완료
- [ ] 더 많은 단위 테스트 작성
- [ ] iOS 빌드 및 App Store 배포

## 📞 문의 및 지원

개발 과정에서 궁금한 점이 있으면 이 가이드를 참고하시거나, 프로젝트의 README.md 파일과 docs/ 폴더의 문서들을 확인하시길 바랍니다.

## 📅 변경 기록 (Change Log)

> **중요한 변화가 있을 때마다 여기에 추가로 작성하기**

### 2025-07-17
- **[초기 설정]** CLAUDE.md 파일 생성
- **[프로젝트 구조]** Features 기반 아키텍처 문서화
- **[개발 규칙]** 함수 스타일, 컴포넌트 최적화 규칙 정의
- **[상태 관리]** Zustand + React Query 패턴 문서화

### 📝 향후 변경사항 작성 가이드

**새로운 변경사항이 있을 때 다음 형식으로 추가:**

```
### YYYY-MM-DD
- **[카테고리]** 변경 내용 설명
- **[버그 수정]** 수정된 문제점
- **[기능 추가]** 새로운 기능 설명
- **[구조 변경]** 아키텍처 또는 폴더 구조 변경
- **[성능 개선]** 최적화 내용
- **[의존성]** 패키지 추가/제거/업데이트
- **[배포]** 빌드 또는 배포 관련 변경
```

---

**마지막 업데이트**: 2025-07-17
**프로젝트 버전**: 1.0.0
**작성자**: Claude Code Assistant