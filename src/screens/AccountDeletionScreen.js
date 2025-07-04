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
              // 현재 사용자 정보 가져오기
              const { data: { user } } = await supabase.auth.getUser();
              
              if (!user) {
                Alert.alert('오류', '로그인 정보를 확인할 수 없습니다.');
                return;
              }

              // 비밀번호 확인
              const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: password
              });

              if (signInError) {
                Alert.alert('오류', '비밀번호가 올바르지 않습니다.');
                return;
              }

              // 계정 삭제 예약 (24시간 유예)
              const DELETION_GRACE_PERIOD = 24 * 60 * 60 * 1000; // 24시간
              const scheduledDeletionTime = new Date(Date.now() + DELETION_GRACE_PERIOD);

              const { error: updateError } = await supabase.auth.updateUser({
                data: { 
                  deletion_request: {
                    requested_at: new Date().toISOString(),
                    scheduled_deletion_at: scheduledDeletionTime.toISOString(),
                    reason: "사용자 요청"
                  }
                }
              });

              if (updateError) {
                Alert.alert('오류', '계정 삭제 요청 중 문제가 발생했습니다.');
                return;
              }

              Alert.alert(
                '계정 삭제 예약',
                `계정이 24시간 후 삭제됩니다.\n\n삭제 예정 시간: ${scheduledDeletionTime.toLocaleString()}\n\n로그인하여 언제든 취소할 수 있습니다.`,
                [
                  {
                    text: '확인',
                    onPress: async function() {
                      // 로그아웃 처리
                      await supabase.auth.signOut();
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
            계정을 삭제하면 모든 데이터가 영구적으로 삭제되며,{'\n'}
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
            계정 삭제를 위해 비밀번호를 입력해주세요.
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
            <Text style={styles.deleteButtonText}>계정 영구 삭제</Text>
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

