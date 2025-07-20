import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { theme } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../shared';
import { supabaseUrl, supabaseAnonKey } from '../services/supabaseClient';
import { createClient } from '@supabase/supabase-js';

export default function AccountDeletionScreen({ navigation }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDeleteAccount() {
    if (!password.trim()) {
      Alert.alert('오류', '비밀번호를 입력해주세요.');
      return;
    }

    Alert.alert(
      '계정 삭제 최종 확인',
      '정말로 계정을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.',
      [
        {
          text: '취소',
          style: 'cancel'
        },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async function() {
            setIsDeleting(true);
            try {
              // 현재 세션과 사용자 정보 가져오기
              const { data: { session: currentSession } } = await supabase.auth.getSession();
              const { data: { user } } = await supabase.auth.getUser();
              
              if (!user || !currentSession) {
                Alert.alert('오류', '로그인 정보를 확인할 수 없습니다.');
                return;
              }

              // 비밀번호 확인 (별도 클라이언트 사용)
              const tempSupabase = createClient(supabaseUrl, supabaseAnonKey);
              
              const { error: signInError } = await tempSupabase.auth.signInWithPassword({
                email: user.email,
                password: password
              });

              if (signInError) {
                Alert.alert('오류', '비밀번호가 올바르지 않습니다.');
                return;
              }

              // 비밀번호 확인 후 임시 클라이언트 로그아웃
              await tempSupabase.auth.signOut();

              // 기존 세션 사용
              console.log('[AccountDeletionScreen] Session 확인:', {
                hasSession: !!currentSession,
                hasAccessToken: !!currentSession?.access_token,
                tokenLength: currentSession?.access_token?.length,
                tokenStart: currentSession?.access_token?.slice(0, 20)
              });

              // 진짜 사용자 계정 삭제 - Service Role Key로 직접 Cascade 삭제
              console.log('[AccountDeletionScreen] 진짜 계정 삭제 시작');
              
              // Service Role Key로 Admin Client 생성 (환경변수에서 로드)
              const serviceRoleKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
              
              if (!serviceRoleKey) {
                throw new Error('Service Role Key가 환경변수에 설정되지 않았습니다.');
              }
              
              const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
                auth: {
                  autoRefreshToken: false,
                  persistSession: false
                }
              });

              console.log('[AccountDeletionScreen] Cascade 데이터 삭제 시작:', user.id);
              
              try {
                // 1. purchase_logs 삭제
                console.log('[AccountDeletionScreen] 1. purchase_logs 삭제 중...');
                const { error: e1 } = await adminSupabase.from('purchase_logs').delete().eq('user_id', user.id);
                if (e1) console.warn('purchase_logs 삭제 실패:', e1.message);
                
                // 2. view_history 삭제
                console.log('[AccountDeletionScreen] 2. view_history 삭제 중...');
                const { error: e2 } = await adminSupabase.from('view_history').delete().eq('user_id', user.id);
                if (e2) console.warn('view_history 삭제 실패:', e2.message);
                
                // 3. bookmarks 삭제
                console.log('[AccountDeletionScreen] 3. bookmarks 삭제 중...');
                const { error: e3 } = await adminSupabase.from('bookmarks').delete().eq('user_id', user.id);
                if (e3) console.warn('bookmarks 삭제 실패:', e3.message);
                
                // 4. hidden_users 삭제 (양방향)
                console.log('[AccountDeletionScreen] 4. hidden_users 삭제 중...');
                const { error: e4a } = await adminSupabase.from('hidden_users').delete().eq('user_id', user.id);
                const { error: e4b } = await adminSupabase.from('hidden_users').delete().eq('hidden_user_id', user.id);
                if (e4a) console.warn('hidden_users(user_id) 삭제 실패:', e4a.message);
                if (e4b) console.warn('hidden_users(hidden_user_id) 삭제 실패:', e4b.message);
                
                // 5. friends 삭제 (양방향)
                console.log('[AccountDeletionScreen] 5. friends 삭제 중...');
                const { error: e5a } = await adminSupabase.from('friends').delete().eq('user_id', user.id);
                const { error: e5b } = await adminSupabase.from('friends').delete().eq('friend_id', user.id);
                if (e5a) console.warn('friends(user_id) 삭제 실패:', e5a.message);
                if (e5b) console.warn('friends(friend_id) 삭제 실패:', e5b.message);
                
                // 6. galleries 삭제
                console.log('[AccountDeletionScreen] 6. galleries 삭제 중...');
                const { error: e6 } = await adminSupabase.from('galleries').delete().eq('creator_id', user.id);
                if (e6) console.warn('galleries 삭제 실패:', e6.message);
                
                // 7. contest_participants 삭제
                console.log('[AccountDeletionScreen] 7. contest_participants 삭제 중...');
                const { error: e7 } = await adminSupabase.from('contest_participants').delete().eq('user_id', user.id);
                if (e7) console.warn('contest_participants 삭제 실패:', e7.message);
                
                // 8. contests 삭제
                console.log('[AccountDeletionScreen] 8. contests 삭제 중...');
                const { error: e8 } = await adminSupabase.from('contests').delete().eq('author_id', user.id);
                if (e8) console.warn('contests 삭제 실패:', e8.message);
                
                // 9. blog_posts 삭제
                console.log('[AccountDeletionScreen] 9. blog_posts 삭제 중...');
                const { error: e9 } = await adminSupabase.from('blog_posts').delete().eq('author_id', user.id);
                if (e9) console.warn('blog_posts 삭제 실패:', e9.message);
                
                // 10. job_posts 삭제
                console.log('[AccountDeletionScreen] 10. job_posts 삭제 중...');
                const { error: e10 } = await adminSupabase.from('job_posts').delete().eq('author_id', user.id);
                if (e10) console.warn('job_posts 삭제 실패:', e10.message);
                
                // 11. files 삭제
                console.log('[AccountDeletionScreen] 11. files 삭제 중...');
                const { error: e11 } = await adminSupabase.from('files').delete().eq('uploaded_by', user.id);
                if (e11) console.warn('files 삭제 실패:', e11.message);
                
                // 12. chat_participants 삭제
                console.log('[AccountDeletionScreen] 12. chat_participants 삭제 중...');
                const { error: e12 } = await adminSupabase.from('chat_participants').delete().eq('user_id', user.id);
                if (e12) console.warn('chat_participants 삭제 실패:', e12.message);
                
                // 13. chat_rooms 삭제 (creator나 participant인 경우)
                console.log('[AccountDeletionScreen] 13. chat_rooms 삭제 중...');
                const { error: e13a } = await adminSupabase.from('chat_rooms').delete().eq('creator_id', user.id);
                const { error: e13b } = await adminSupabase.from('chat_rooms').delete().eq('participant_id', user.id);
                if (e13a) console.warn('chat_rooms(creator_id) 삭제 실패:', e13a.message);
                if (e13b) console.warn('chat_rooms(participant_id) 삭제 실패:', e13b.message);
                
                // 14. messages 삭제
                console.log('[AccountDeletionScreen] 14. messages 삭제 중...');
                const { error: e14 } = await adminSupabase.from('messages').delete().eq('sender_id', user.id);
                if (e14) console.warn('messages 삭제 실패:', e14.message);
                
                // 15. works 삭제
                console.log('[AccountDeletionScreen] 15. works 삭제 중...');
                const { error: e15 } = await adminSupabase.from('works').delete().eq('author_id', user.id);
                if (e15) console.warn('works 삭제 실패:', e15.message);
                
                // 16. contents 삭제
                console.log('[AccountDeletionScreen] 16. contents 삭제 중...');
                const { error: e16 } = await adminSupabase.from('contents').delete().eq('user_id', user.id);
                if (e16) console.warn('contents 삭제 실패:', e16.message);
                
                // 17. user_profiles 삭제
                console.log('[AccountDeletionScreen] 17. user_profiles 삭제 중...');
                const { error: e17 } = await adminSupabase.from('user_profiles').delete().eq('id', user.id);
                if (e17) console.warn('user_profiles 삭제 실패:', e17.message);
                
                console.log('[AccountDeletionScreen] 모든 관련 데이터 삭제 완료');
                
              } catch (dataError) {
                console.error('[AccountDeletionScreen] 데이터 삭제 중 오류:', dataError);
                // 데이터 삭제 실패해도 auth 사용자 삭제는 계속 시도
              }
              
              // 18. Auth 사용자 삭제 (마지막)
              console.log('[AccountDeletionScreen] Auth 사용자 삭제 시작');
              const { error: deleteError } = await adminSupabase.auth.admin.deleteUser(user.id);

              if (deleteError) {
                console.error('[AccountDeletionScreen] Auth 사용자 삭제 실패:', deleteError);
                throw new Error(`계정 삭제 실패: ${deleteError.message}`);
              }

              console.log('[AccountDeletionScreen] 사용자 완전 삭제 완료:', user.id);

              Alert.alert(
                '계정 삭제 완료',
                '계정이 성공적으로 삭제되었습니다.',
                [
                  {
                    text: '확인',
                    onPress: function() {
                      // 로그아웃은 자동으로 처리됨
                    }
                  }
                ]
              );
            } catch (error) {
              console.error('계정 삭제 오류:', error);
              Alert.alert('오류', '계정 삭제 중 문제가 발생했습니다.');
            } finally {
              setIsDeleting(false);
            }
          }
        }
      ]
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={function() { navigation.goBack(); }}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>계정 삭제</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 경고 섹션 */}
        <View style={styles.warningSection}>
          <View style={styles.warningIcon}>
            <Ionicons name="warning" size={48} color={theme.colors.error} />
          </View>
          <Text style={styles.warningTitle}>계정을 삭제하시겠습니까?</Text>
          <Text style={styles.warningText}>
            계정을 삭제하면 모든 데이터가 즉시 영구적으로 삭제되며,{'\n'}
            이 작업은 되돌릴 수 없습니다.
          </Text>
        </View>

        {/* 삭제될 데이터 설명 */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>삭제되는 항목</Text>
          
          <View style={styles.infoItem}>
            <Ionicons name="person-outline" size={20} color={theme.colors.text.primary} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoText}>프로필 정보 및 계정 설정</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="images-outline" size={20} color={theme.colors.text.primary} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoText}>업로드한 모든 작품 및 갤러리</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="chatbubble-outline" size={20} color={theme.colors.text.primary} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoText}>채팅 메시지 및 대화 내역</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="bookmark-outline" size={20} color={theme.colors.text.primary} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoText}>북마크 정보</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="document-text-outline" size={20} color={theme.colors.text.primary} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoText}>작성한 구인구직 글</Text>
            </View>
          </View>
        </View>

        {/* 비밀번호 확인 섹션 */}
        <View style={styles.passwordSection}>
          <Text style={styles.passwordTitle}>비밀번호 확인</Text>
          <Text style={styles.passwordSubtext}>
            계정을 즉시 삭제하기 위해 비밀번호를 입력해주세요.
          </Text>
          
          <View style={styles.passwordInputContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="비밀번호 입력"
              placeholderTextColor={theme.colors.text.placeholder}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              editable={!isDeleting}
            />
            <TouchableOpacity
              onPress={function() { setShowPassword(!showPassword); }}
              style={styles.eyeButton}
            >
              <Ionicons 
                name={showPassword ? "eye-off" : "eye"} 
                size={20} 
                color={theme.colors.text.secondary} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* 삭제 버튼 */}
        <TouchableOpacity
          style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
          onPress={handleDeleteAccount}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.deleteButtonText}>계정 즉시 삭제</Text>
          )}
        </TouchableOpacity>

        {/* 취소 버튼 */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={function() { navigation.goBack(); }}
          disabled={isDeleting}
        >
          <Text style={styles.cancelButtonText}>취소</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 60,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  headerRight: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  warningSection: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
  },
  warningIcon: {
    marginBottom: theme.spacing.md,
  },
  warningTitle: {
    ...theme.typography.heading,
    fontSize: 24,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  warningText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  infoSection: {
    backgroundColor: 'white',
    marginHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    ...theme.shadows.small,
  },
  infoTitle: {
    ...theme.typography.subheading,
    fontSize: 18,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  infoTextContainer: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  infoText: {
    ...theme.typography.body,
    fontSize: 14,
    color: theme.colors.text.primary,
  },
  passwordSection: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  passwordTitle: {
    ...theme.typography.subheading,
    fontSize: 18,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  passwordSubtext: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  eyeButton: {
    padding: theme.spacing.md,
  },
  deleteButton: {
    backgroundColor: theme.colors.error,
    marginHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  deleteButtonText: {
    ...theme.typography.body,
    color: 'white',
    fontWeight: '600',
  },
  cancelButton: {
    marginHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cancelButtonText: {
    ...theme.typography.body,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  bottomSpace: {
    height: 50,
  },
});

