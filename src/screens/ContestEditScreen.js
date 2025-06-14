import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { theme } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabaseClient';

export default function ContestEditScreen({ navigation, route }) {
  const { contestId } = route.params;
  const [contest, setContest] = useState({
    title: '',
    organizer: '',
    period: '',
    prize: '',
    description: '',
    requirements: '',
    tags: ''
  });
  const [loading, setLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    if (contestId) {
      setIsEdit(true);
      loadContest();
    }
  }, [contestId]);

  const loadContest = async () => {
    try {
      // 여기에 실제 콘테스트 데이터 로드 로직 추가
      // 현재는 더미 데이터
      setContest({
        title: '제1회 디지털 아트 콘테스트',
        organizer: '포트폴리오 플랫폼',
        period: '2024.06.01 - 2024.08.31',
        prize: '100만원',
        description: '창의적인 디지털 아트 작품을 공모합니다.',
        requirements: '- 디지털 아트 작품\n- 해상도 1920x1080 이상\n- 미발표 작품',
        tags: '디지털아트,콘테스트,창작'
      });
    } catch (error) {
      Alert.alert('오류', '콘테스트 정보를 불러올 수 없습니다.');
    }
  };

  const handleSave = async () => {
    if (!contest.title.trim() || !contest.organizer.trim()) {
      Alert.alert('입력 오류', '제목과 주최자는 필수 입력 항목입니다.');
      return;
    }

    try {
      setLoading(true);
      
      // 여기에 실제 저장 로직 추가
      Alert.alert('성공', `콘테스트가 ${isEdit ? '수정' : '등록'}되었습니다.`, [
        { text: '확인', onPress: () => navigation.goBack() }
      ]);
      
    } catch (error) {
      Alert.alert('오류', `콘테스트 ${isEdit ? '수정' : '등록'}에 실패했습니다.`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setContest(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEdit ? '콘테스트 수정' : '콘테스트 등록'}
        </Text>
        <TouchableOpacity 
          onPress={handleSave}
          disabled={loading}
          style={[styles.saveButton, loading && styles.disabledButton]}
        >
          <Text style={[styles.saveButtonText, loading && styles.disabledText]}>
            {loading ? '저장중...' : '저장'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 제목 */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>제목 *</Text>
          <TextInput
            style={styles.input}
            value={contest.title}
            onChangeText={(value) => handleInputChange('title', value)}
            placeholder="콘테스트 제목을 입력하세요"
            placeholderTextColor={theme.colors.text.placeholder}
          />
        </View>

        {/* 주최자 */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>주최자 *</Text>
          <TextInput
            style={styles.input}
            value={contest.organizer}
            onChangeText={(value) => handleInputChange('organizer', value)}
            placeholder="주최자명을 입력하세요"
            placeholderTextColor={theme.colors.text.placeholder}
          />
        </View>

        {/* 기간 */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>기간</Text>
          <TextInput
            style={styles.input}
            value={contest.period}
            onChangeText={(value) => handleInputChange('period', value)}
            placeholder="콘테스트 기간을 입력하세요 (예: 2024.06.01 - 2024.08.31)"
            placeholderTextColor={theme.colors.text.placeholder}
          />
        </View>

        {/* 상금 */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>상금</Text>
          <TextInput
            style={styles.input}
            value={contest.prize}
            onChangeText={(value) => handleInputChange('prize', value)}
            placeholder="상금을 입력하세요"
            placeholderTextColor={theme.colors.text.placeholder}
          />
        </View>

        {/* 설명 */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>설명</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={contest.description}
            onChangeText={(value) => handleInputChange('description', value)}
            placeholder="콘테스트 설명을 입력하세요"
            placeholderTextColor={theme.colors.text.placeholder}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* 참가 요건 */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>참가 요건</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={contest.requirements}
            onChangeText={(value) => handleInputChange('requirements', value)}
            placeholder="참가 요건을 입력하세요"
            placeholderTextColor={theme.colors.text.placeholder}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* 태그 */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>태그</Text>
          <TextInput
            style={styles.input}
            value={contest.tags}
            onChangeText={(value) => handleInputChange('tags', value)}
            placeholder="태그를 쉼표로 구분하여 입력하세요"
            placeholderTextColor={theme.colors.text.placeholder}
          />
        </View>

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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  headerTitle: {
    ...theme.typography.heading,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: theme.spacing.md,
  },
  saveButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.medium,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: theme.colors.text.secondary,
  },
  disabledText: {
    color: theme.colors.text.placeholder,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  inputGroup: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.text.primary,
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 100,
    paddingTop: theme.spacing.md,
  },
  bottomSpace: {
    height: 50,
  },
});