import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { theme } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabaseClient';

export default function ProfileEditScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [shortIntro, setShortIntro] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        
        // user_profiles 테이블에서 프로필 정보 가져오기
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profile && !error) {
          setUsername(profile.username || '');
          setShortIntro(profile.short_intro || '');
          setInfo(profile.info || '');
        }
      }
    } catch (error) {
      console.error('프로필 로드 오류:', error);
    }
  };


  const handleSave = async () => {
    if (shortIntro.length > 10) {
      Alert.alert('알림', '짧은 소개는 10자 이내로 작성해주세요.');
      return;
    }

    setLoading(true);
    try {
      console.log('Profile update data:', {
        id: user.id,
        username: username,
        username_length: username.length,
        username_type: typeof username,
        short_intro: shortIntro,
        info: info
      });

      // 먼저 현재 데이터 확인
      const { data: currentProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      

      // user_profiles 테이블 업데이트
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          username: username.trim(),
          short_intro: shortIntro,
          info: info,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select();

      // auth.users의 user_metadata도 업데이트
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          username: username.trim(),
          full_name: username.trim()
        }
      });

      if (error) {
        console.error('Supabase 오류 상세:', {
          error,
          code: error.code,
          message: error.message,
          details: error.details
        });
        throw error;
      }

      if (authError) {
        console.error('Auth 업데이트 오류:', authError);
        throw authError;
      }

      Alert.alert('성공', '프로필이 업데이트되었습니다.');
      navigation.goBack();
    } catch (error) {
      console.error('프로필 저장 오류:', error);
      Alert.alert('오류', `프로필 저장에 실패했습니다: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };


  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>프로필 편집</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          <Text style={[styles.saveButton, loading && styles.saveButtonDisabled]}>
            저장
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 사용자 이름 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>사용자 이름</Text>
          <Text style={styles.sectionDescription}>고유한 사용자 이름을 설정하세요</Text>
          <TextInput
            style={styles.usernameInput}
            value={username}
            onChangeText={setUsername}
            placeholder="사용자 이름"
            maxLength={20}
            placeholderTextColor={theme.colors.text.secondary}
          />
        </View>

        {/* 짧은 소개 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>짧은 소개</Text>
          <Text style={styles.sectionDescription}>10자 이내로 자신을 표현해주세요</Text>
          <TextInput
            style={styles.shortIntroInput}
            value={shortIntro}
            onChangeText={setShortIntro}
            placeholder="예: 꿈꾸는 작가"
            maxLength={10}
            placeholderTextColor={theme.colors.text.secondary}
          />
          <Text style={styles.charCount}>{shortIntro.length}/10</Text>
        </View>

        {/* INFO 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INFO</Text>
          <Text style={styles.sectionDescription}>자세한 소개를 작성해주세요</Text>
          <TextInput
            style={styles.infoInput}
            value={info}
            onChangeText={setInfo}
            placeholder="자신에 대한 소개, 작품 활동, 관심사 등을 자유롭게 작성해주세요"
            multiline
            numberOfLines={6}
            placeholderTextColor={theme.colors.text.secondary}
            textAlignVertical="top"
            maxLength={500}
          />
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 60,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    ...theme.typography.heading,
    fontWeight: '600',
  },
  saveButton: {
    ...theme.typography.body,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  sectionTitle: {
    ...theme.typography.heading,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  sectionDescription: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
  },
  shortIntroInput: {
    ...theme.typography.body,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.medium,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: 'white',
  },
  charCount: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    textAlign: 'right',
    marginTop: theme.spacing.xs,
  },
  usernameInput: {
    ...theme.typography.body,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.medium,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: 'white',
  },
  infoInput: {
    ...theme.typography.body,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.medium,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: 'white',
    minHeight: 120,
  },
  worksGrid: {
    marginTop: theme.spacing.sm,
  },
  workItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.medium,
    marginBottom: theme.spacing.sm,
    backgroundColor: 'white',
  },
  workItemSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}10`,
  },
  workContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  workTitle: {
    ...theme.typography.body,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  workTitleSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.lg,
  },
});