import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { theme } from '../../../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../shared';
import { useLanguage } from '../../../contexts/LanguageContext';
import { logger } from '../../../shared';

export default function ProfileEditScreen({ navigation }) {
  const { t } = useLanguage();
  const [username, setUsername] = useState('');
  const [shortIntro, setShortIntro] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(function() {
    loadProfileData();
  }, []);

  async function loadProfileData() {
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
      console.error('Profile load error:', error);
    }
  };


  async function handleSave() {
    if (shortIntro.length > 10) {
      Alert.alert(t('notification'), t('shortIntroLengthError'));
      return;
    }

    setLoading(true);
    try {
      logger.log('Profile update data:', {
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

      Alert.alert(t('success'), t('profileUpdated'));
      navigation.goBack();
    } catch (error) {
      console.error('Profile save error:', error);
      Alert.alert(t('error'), `${t('profileSaveFailed')} ${error.message}`);
    } finally {
      setLoading(false);
    }
  };


  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={function() { navigation.goBack(); }}>
          <Ionicons name="close" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profileEdit')}</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          <Text style={[styles.saveButton, loading && styles.saveButtonDisabled]}>
            {t('save')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 사용자 이름 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('username')}</Text>
          <Text style={styles.sectionDescription}>{t('uniqueUsernameDescription')}</Text>
          <TextInput
            style={styles.usernameInput}
            value={username}
            onChangeText={setUsername}
            placeholder={t('username')}
            maxLength={20}
            placeholderTextColor={theme.colors.text.secondary}
          />
        </View>

        {/* 짧은 소개 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('shortIntro')}</Text>
          <Text style={styles.sectionDescription}>{t('shortIntroDescription')}</Text>
          <TextInput
            style={styles.shortIntroInput}
            value={shortIntro}
            onChangeText={setShortIntro}
            placeholder={t('shortIntroExample')}
            maxLength={10}
            placeholderTextColor={theme.colors.text.secondary}
          />
          <Text style={styles.charCount}>{shortIntro.length}/10</Text>
        </View>

        {/* INFO 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('info')}</Text>
          <Text style={styles.sectionDescription}>{t('detailedIntroDescription')}</Text>
          <TextInput
            style={styles.infoInput}
            value={info}
            onChangeText={setInfo}
            placeholder={t('profileInfoPlaceholder')}
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
    ...theme.typography.body,
    fontSize: 22,
    fontWeight: '600',
    color: '#000000',
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
    ...theme.typography.body,
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
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

