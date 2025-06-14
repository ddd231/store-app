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

export default function JobEditScreen({ navigation, route }) {
  const { jobId } = route.params;
  const [job, setJob] = useState({
    title: '',
    company: '',
    location: '',
    description: '',
    requirements: '',
    benefits: '',
    contactEmail: '',
    tags: ''
  });
  const [loading, setLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    if (jobId) {
      setIsEdit(true);
      loadJob();
    }
  }, [jobId]);

  const loadJob = async () => {
    try {
      // 여기에 실제 채용공고 데이터 로드 로직 추가
      // 현재는 더미 데이터
      setJob({
        title: 'UI/UX 디자이너',
        company: '크리에이티브 스튜디오',
        location: '서울시 강남구',
        description: '사용자 경험을 개선하는 UI/UX 디자이너를 모집합니다.',
        requirements: '- 관련 경력 2년 이상\n- Figma, Sketch 능숙\n- 포트폴리오 필수',
        benefits: '- 4대보험\n- 연봉협상가능\n- 자율출퇴근',
        contactEmail: 'hr@creative-studio.com',
        tags: 'UI,UX,디자인,Figma'
      });
    } catch (error) {
      Alert.alert('오류', '채용공고 정보를 불러올 수 없습니다.');
    }
  };

  const handleSave = async () => {
    if (!job.title.trim() || !job.company.trim() || !job.contactEmail.trim()) {
      Alert.alert('입력 오류', '제목, 회사명, 연락처는 필수 입력 항목입니다.');
      return;
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(job.contactEmail)) {
      Alert.alert('입력 오류', '올바른 이메일 형식을 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      
      // 여기에 실제 저장 로직 추가
      Alert.alert('성공', `채용공고가 ${isEdit ? '수정' : '등록'}되었습니다.`, [
        { text: '확인', onPress: () => navigation.goBack() }
      ]);
      
    } catch (error) {
      Alert.alert('오류', `채용공고 ${isEdit ? '수정' : '등록'}에 실패했습니다.`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setJob(prev => ({
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
          {isEdit ? '채용공고 수정' : '채용공고 등록'}
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
            value={job.title}
            onChangeText={(value) => handleInputChange('title', value)}
            placeholder="채용공고 제목을 입력하세요"
            placeholderTextColor={theme.colors.text.placeholder}
          />
        </View>

        {/* 회사명 */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>회사명 *</Text>
          <TextInput
            style={styles.input}
            value={job.company}
            onChangeText={(value) => handleInputChange('company', value)}
            placeholder="회사명을 입력하세요"
            placeholderTextColor={theme.colors.text.placeholder}
          />
        </View>

        {/* 근무지 */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>근무지</Text>
          <TextInput
            style={styles.input}
            value={job.location}
            onChangeText={(value) => handleInputChange('location', value)}
            placeholder="근무지를 입력하세요"
            placeholderTextColor={theme.colors.text.placeholder}
          />
        </View>

        {/* 담당업무 */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>담당업무</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={job.description}
            onChangeText={(value) => handleInputChange('description', value)}
            placeholder="담당업무를 입력하세요"
            placeholderTextColor={theme.colors.text.placeholder}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* 자격요건 */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>자격요건</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={job.requirements}
            onChangeText={(value) => handleInputChange('requirements', value)}
            placeholder="자격요건을 입력하세요"
            placeholderTextColor={theme.colors.text.placeholder}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* 우대사항 */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>우대사항</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={job.benefits}
            onChangeText={(value) => handleInputChange('benefits', value)}
            placeholder="우대사항을 입력하세요"
            placeholderTextColor={theme.colors.text.placeholder}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* 연락처 */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>연락처 이메일 *</Text>
          <TextInput
            style={styles.input}
            value={job.contactEmail}
            onChangeText={(value) => handleInputChange('contactEmail', value)}
            placeholder="연락처 이메일을 입력하세요"
            placeholderTextColor={theme.colors.text.placeholder}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* 태그 */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>태그</Text>
          <TextInput
            style={styles.input}
            value={job.tags}
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