# Supabase 빠른 설정 가이드 🚀

chat-app을 실행하기 위해 Supabase 프로젝트를 설정하는 방법입니다.

## 1. Supabase 프로젝트 생성 (2분)

1. [https://app.supabase.com](https://app.supabase.com) 접속
2. "New Project" 클릭
3. 프로젝트 정보 입력:
   - Project name: `chat-app` (또는 원하는 이름)
   - Database Password: 강력한 비밀번호 설정
   - Region: `Northeast Asia (Seoul)` 선택 (한국에서 가장 빠름)

## 2. API 키 가져오기 (30초)

프로젝트가 생성되면:

1. 왼쪽 메뉴에서 ⚙️ **Settings** 클릭
2. **API** 탭 클릭
3. 다음 두 가지 정보를 복사:
   - **Project URL**: `https://xxxxx.supabase.co` 형태
   - **anon/public** key: 긴 문자열

## 3. .env 파일 업데이트 (1분)

`/home/sadf/.env` 파일을 열고 다음과 같이 수정:

```env
# Supabase Configuration
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co

REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **중요**: 4개 변수 모두에 같은 값을 넣어주세요!

## 4. 데이터베이스 테이블 생성 (2분)

1. Supabase 대시보드에서 **SQL Editor** 클릭
2. 다음 SQL을 실행:

```sql
-- 사용자 테이블
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 채팅방 테이블
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 메시지 테이블
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS (Row Level Security) 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽을 수 있도록 정책 추가
CREATE POLICY "Public users are readable" ON users
  FOR SELECT USING (true);

CREATE POLICY "Public rooms are readable" ON rooms
  FOR SELECT USING (true);

CREATE POLICY "Public messages are readable" ON messages
  FOR SELECT USING (true);

-- 인증된 사용자가 쓸 수 있도록 정책 추가
CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "Authenticated users can create rooms" ON rooms
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can send messages" ON messages
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

## 5. 앱 실행 (1분)

터미널에서:

```bash
cd /home/sadf
npm start
```

그 다음:
- 📱 **Expo Go 앱**으로 QR 코드 스캔 (모바일)
- 🌐 **w** 키를 눌러 웹 브라우저에서 실행
- 🤖 **a** 키를 눌러 Android 에뮬레이터에서 실행
- 🍎 **i** 키를 눌러 iOS 시뮬레이터에서 실행

## 문제 해결

### "Invalid API key" 오류
→ .env 파일의 키가 정확한지 확인하고, 서버를 재시작하세요:
```bash
npm start -- -c
```

### "Network error" 오류
→ Supabase URL이 정확한지 확인하세요 (https:// 포함)

### 테이블이 없다는 오류
→ 위의 SQL을 Supabase SQL Editor에서 실행했는지 확인하세요

## 완료! 🎉

이제 chat-app이 Supabase와 연결되어 실시간 채팅이 가능합니다!