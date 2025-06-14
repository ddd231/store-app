-- Chat Room Tables Schema with RLS policies
-- 채팅방 테이블 및 보안 정책 설정

-- 1. 채팅방 테이블
CREATE TABLE IF NOT EXISTS chat_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_message TEXT,
  is_direct BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- 2. 채팅방 참여자 테이블
CREATE TABLE IF NOT EXISTS chat_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  role TEXT DEFAULT 'member', -- 'admin', 'member'
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. 메시지 테이블
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID,
  sender_name TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  message_type TEXT DEFAULT 'text', -- 'text', 'image', 'system'
  metadata JSONB DEFAULT '{}'::jsonb
);

-- 4. 읽음 확인 테이블
CREATE TABLE IF NOT EXISTS message_read_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  read_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_chat_rooms_created_by ON chat_rooms(created_by);
CREATE INDEX IF NOT EXISTS idx_chat_participants_room_id ON chat_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user_id ON chat_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);

-- 채팅방 업데이트 트리거
CREATE OR REPLACE FUNCTION update_chat_room_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_chat_room_timestamp_trigger
BEFORE UPDATE ON chat_rooms
FOR EACH ROW
EXECUTE FUNCTION update_chat_room_timestamp();

-- 메시지 업데이트 트리거
CREATE OR REPLACE FUNCTION update_message_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_message_timestamp_trigger
BEFORE UPDATE ON messages
FOR EACH ROW
EXECUTE FUNCTION update_message_timestamp();

-- 메시지 생성 후 채팅방 업데이트 트리거
CREATE OR REPLACE FUNCTION update_chat_room_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_rooms
  SET last_message = NEW.content, updated_at = now()
  WHERE id = NEW.room_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_chat_room_on_message_trigger
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_chat_room_on_message();

-- RLS 정책 설정

-- 모든 테이블에 RLS 활성화
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_read_status ENABLE ROW LEVEL SECURITY;

-- 채팅방 RLS 정책
-- 1. 생성자는 모든 권한
CREATE POLICY chat_rooms_creator_policy ON chat_rooms
  FOR ALL
  USING (auth.uid() = created_by);

-- 2. 참여자는 조회 가능
CREATE POLICY chat_rooms_participant_select_policy ON chat_rooms
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_participants
      WHERE chat_participants.room_id = chat_rooms.id
      AND chat_participants.user_id = auth.uid()
    )
  );

-- 채팅 참여자 RLS 정책
-- 1. 채팅방 생성자 또는 관리자는 참여자 관리 가능
CREATE POLICY chat_participants_admin_policy ON chat_participants
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM chat_rooms
      WHERE chat_rooms.id = chat_participants.room_id
      AND chat_rooms.created_by = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM chat_participants admin_check
      WHERE admin_check.room_id = chat_participants.room_id
      AND admin_check.user_id = auth.uid()
      AND admin_check.role = 'admin'
    )
  );

-- 2. 참여자는 자신의 참여 정보를 볼 수 있음
CREATE POLICY chat_participants_self_select_policy ON chat_participants
  FOR SELECT
  USING (user_id = auth.uid());

-- 메시지 RLS 정책
-- 1. 참여자는 메시지 읽기 가능
CREATE POLICY messages_participant_select_policy ON messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_participants
      WHERE chat_participants.room_id = messages.room_id
      AND chat_participants.user_id = auth.uid()
    )
  );

-- 2. 자신의 메시지만 수정/삭제 가능
CREATE POLICY messages_author_update_delete_policy ON messages
  FOR ALL
  USING (sender_id = auth.uid());

-- 3. 참여자는 메시지 작성 가능
CREATE POLICY messages_participant_insert_policy ON messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_participants
      WHERE chat_participants.room_id = messages.room_id
      AND chat_participants.user_id = auth.uid()
    )
  );

-- 읽음 확인 RLS 정책
-- 1. 자신의 읽음 확인 상태만 관리 가능
CREATE POLICY message_read_status_self_policy ON message_read_status
  FOR ALL
  USING (user_id = auth.uid());

-- 2. 참여자는 다른 사용자의 읽음 확인 상태 확인 가능
CREATE POLICY message_read_status_participant_select_policy ON message_read_status
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM messages
      JOIN chat_participants ON messages.room_id = chat_participants.room_id
      WHERE messages.id = message_read_status.message_id
      AND chat_participants.user_id = auth.uid()
    )
  );

-- 실시간 기능 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_rooms; 