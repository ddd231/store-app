import React, { useState } from 'react';
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
import { createJobPost } from '../services/jobService';
import { sanitizeInput } from '../utils/sanitizer';

export default function JobPostScreen({ navigation }) {
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    description: '',
    requirements: '',
    benefits: '',
    contactEmail: '',
    tags: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    const required = ['title', 'company', 'location', 'description', 'contactEmail'];
    for (let field of required) {
      if (!formData[field].trim()) {
        Alert.alert('입력 오류', `${getFieldName(field)}을(를) 입력해주세요.`);
        return false;
      }
    }
    
    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.contactEmail)) {
      Alert.alert('입력 오류', '올바른 이메일 형식을 입력해주세요.');
      return false;
    }
    
    return true;
  };

  const getFieldName = (field) => {
    const fieldNames = {
      title: '채용 제목',
      company: '회사명',
      location: '근무지',
      description: '채용 내용',
      contactEmail: '연락처 이메일'
    };
    return fieldNames[field] || field;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      // XSS 방어를 위한 입력값 필터링
      const sanitizedData = {
        ...formData,
        title: sanitizeInput(formData.title),
        company: sanitizeInput(formData.company),
        location: sanitizeInput(formData.location),
        description: sanitizeInput(formData.description),
        requirements: sanitizeInput(formData.requirements),
        benefits: sanitizeInput(formData.benefits),
        tags: sanitizeInput(formData.tags)
      };
      
      const result = await createJobPost(sanitizedData);
      
      Alert.alert(
        '등록 완료', 
        '채용공고가 성공적으로 등록되었습니다.',
        [
          {
            text: '확인',
            onPress: () => navigation.goBack()
          }
        ]
      );
      
    } catch (error) {
      console.error('채용공고 등록 오류:', error);
      let errorMessage = '채용공고 등록 중 오류가 발생했습니다.';
      
      if (error.message.includes('로그인')) {
        errorMessage = '로그인이 필요합니다.';
      } else if (error.message) {
        errorMessage = __DEV__ ? error.message : '채용공고 등록 중 오류가 발생했습니다.';
      }
      
      Alert.alert('오류', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>채용공고 올리기</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 기본 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>기본 정보</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>채용 제목 *</Text>
            <TextInput
              style={styles.input}
              value={formData.title}
              onChangeText={(value) => handleInputChange('title', value)}
              placeholder="예: UI/UX 디자이너 모집"
              placeholderTextColor={theme.colors.text.placeholder}
              maxLength={100}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>회사명 *</Text>
            <TextInput
              style={styles.input}
              value={formData.company}
              onChangeText={(value) => handleInputChange('company', value)}
              placeholder="예: (주)테크컴퍼니"
              placeholderTextColor={theme.colors.text.placeholder}
              maxLength={50}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>근무지 *</Text>
            <TextInput
              style={styles.input}
              value={formData.location}
              onChangeText={(value) => handleInputChange('location', value)}
              placeholder="예: 서울 강남구 또는 재택근무"
              placeholderTextColor={theme.colors.text.placeholder}
              maxLength={50}
            />
          </View>
        </View>

        {/* 상세 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>상세 정보</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>채용 내용 *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(value) => handleInputChange('description', value)}
              placeholder="담당 업무, 업무 환경 등을 자세히 작성해주세요."
              placeholderTextColor={theme.colors.text.placeholder}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={2000}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>지원 자격 요건</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.requirements}
              onChangeText={(value) => handleInputChange('requirements', value)}
              placeholder="필요한 경력, 기술, 자격증 등을 작성해주세요."
              placeholderTextColor={theme.colors.text.placeholder}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              maxLength={1000}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>복리후생 및 우대사항</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.benefits}
              onChangeText={(value) => handleInputChange('benefits', value)}
              placeholder="복리후생, 우대사항 등을 작성해주세요."
              placeholderTextColor={theme.colors.text.placeholder}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              maxLength={1000}
            />
          </View>
        </View>

        {/* 연락처 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>연락처 정보</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>연락처 이메일 *</Text>
            <TextInput
              style={styles.input}
              value={formData.contactEmail}
              onChangeText={(value) => handleInputChange('contactEmail', value)}
              placeholder="example@company.com"
              placeholderTextColor={theme.colors.text.placeholder}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>태그 (선택)</Text>
            <TextInput
              style={styles.input}
              value={formData.tags}
              onChangeText={(value) => handleInputChange('tags', value)}
              placeholder="예: UI/UX, 디자인, 신입환영 (쉼표로 구분)"
              placeholderTextColor={theme.colors.text.placeholder}
            />
          </View>
        </View>

        {/* 제출 버튼 */}
        <TouchableOpacity 
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? '등록 중...' : '채용공고 등록하기'}
          </Text>
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
    paddingHorizontal: theme.spacing.lg,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  inputGroup: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.medium,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: 14,
    color: theme.colors.text.primary,
    backgroundColor: 'white',
  },
  textArea: {
    height: 80,
    paddingTop: theme.spacing.sm,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  submitButtonDisabled: {
    backgroundColor: theme.colors.text.secondary,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpace: {
    height: 100,
  },
});