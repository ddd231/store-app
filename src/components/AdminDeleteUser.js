import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { theme } from '../styles/theme';
import { supabase } from '../shared';

export default function AdminDeleteUser() {
  const [userId, setUserId] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDeleteUser() {
    if (!userId.trim()) {
      Alert.alert('오류', '사용자 ID를 입력해주세요.');
      return;
    }

    Alert.alert(
      '관리자 계정 삭제',
      `사용자 ID: ${userId}\n\n정말로 이 계정을 삭제하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async function() {
            setIsDeleting(true);
            try {
              // Edge Function 호출하여 사용자 삭제
              const { data: { session } } = await supabase.auth.getSession();
              
              if (!session) {
                Alert.alert('오류', '관리자 권한이 필요합니다.');
                return;
              }

              const response = await fetch(`${supabase.supabaseUrl}/functions/v1/delete-user`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session.access_token}`,
                  'apikey': supabase.supabaseKey,
                },
                body: JSON.stringify({
                  user_id: userId,
                  force_delete: true
                })
              });

              const result = await response.json();

              if (!response.ok) {
                throw new Error(result.error || '삭제 실패');
              }

              Alert.alert(
                '삭제 완료',
                `사용자 계정이 성공적으로 삭제되었습니다.\n삭제된 ID: ${result.deleted_user_id}`,
                [{ text: '확인' }]
              );
              
              setUserId('');
              
            } catch (error) {
              console.error('관리자 삭제 오류:', error);
              Alert.alert('오류', `삭제 실패: ${error.message}`);
            } finally {
              setIsDeleting(false);
            }
          }
        }
      ]
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>관리자 계정 삭제</Text>
      <Text style={styles.warning}>
        ⚠️ 이 기능은 관리자만 사용할 수 있습니다.
      </Text>
      
      <Text style={styles.label}>사용자 ID</Text>
      <TextInput
        style={styles.input}
        placeholder="삭제할 사용자의 UUID 입력"
        value={userId}
        onChangeText={setUserId}
        autoCapitalize="none"
        editable={!isDeleting}
      />

      <TouchableOpacity
        style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
        onPress={handleDeleteUser}
        disabled={isDeleting}
      >
        {isDeleting ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.deleteButtonText}>계정 삭제</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.medium,
    margin: theme.spacing.md,
  },
  title: {
    ...theme.typography.heading,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  warning: {
    ...theme.typography.caption,
    color: theme.colors.warning,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  label: {
    ...theme.typography.body,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.medium,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    color: theme.colors.text.primary,
  },
  deleteButton: {
    backgroundColor: theme.colors.error,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  deleteButtonText: {
    ...theme.typography.body,
    color: 'white',
    fontWeight: '600',
  },
});