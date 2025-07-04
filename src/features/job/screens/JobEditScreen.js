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
import { theme } from '../../../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { getJobPost, updateJobPost, createJobPost, deleteJobPost } from '../services/jobService';
import { supabase } from '../../../shared';

function JobEditScreen({ navigation, route }) {
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

  useEffect(function() {
    if (jobId) {
      setIsEdit(true);
      loadJob();
    }
  }, [jobId]);

  async function loadJob() {
    try {
      const data = await getJobPost(jobId);
      setJob({
        title: data.title,
        company: data.company,
        location: data.location,
        description: data.description,
        requirements: data.requirements || '',
        benefits: data.benefits || '',
        contactEmail: data.contact_email,
        tags: data.tags ? data.tags.join(',') : ''
      });
    } catch (error) {
      console.error('채용공고 로딩 오류:', error);
      Alert.alert('오류', '채용공고 정보를 불러올 수 없습니다.');
    }
  };

  async function handleSave() {
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
      
      const jobData = {
        title: job.title.trim(),
        company: job.company.trim(),
        location: job.location.trim(),
        description: job.description.trim(),
        requirements: job.requirements.trim(),
        benefits: job.benefits.trim(),
        contactEmail: job.contactEmail.trim(),
        tags: job.tags.trim()
      };

      if (isEdit) {
        await updateJobPost(jobId, jobData);
      } else {
        await createJobPost(jobData);
      }
      
      Alert.alert('성공', `채용공고가 ${isEdit ? '수정' : '등록'}되었습니다.`, [
        { text: '확인', onPress: function() { navigation.goBack(); } }
      ]);
      
    } catch (error) {
      Alert.alert('오류', `채용공고 ${isEdit ? '수정' : '등록'}에 실패했습니다.`);
    } finally {
      setLoading(false);
    }
  };

  function handleInputChange(field, value) {
    setJob(function(prev) { return ({
      ...prev,
      [field]: value
    }); });
  };

  async function handleDelete() {
    Alert.alert(
      '채용공고 삭제',
      '정말로 이 채용공고를 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async function() {
            try {
              setLoading(true);
              await deleteJobPost(jobId);
              Alert.alert('삭제 완료', '채용공고가 삭제되었습니다.', [
                { text: '확인', onPress: function() { navigation.goBack(); } }
              ]);
            } catch (error) {
              console.error('채용공고 삭제 오류:', error);
              Alert.alert('오류', '채용공고 삭제에 실패했습니다.');
            } finally {
              setLoading(false);
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
        <TouchableOpacity onPress={function() { navigation.goBack(); }}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEdit ? '채용공고 수정' : '채용공고 등록'}
        </Text>
        <View style={styles.headerButtons}>
          {isEdit && (
            <TouchableOpacity 
              onPress={handleDelete}
              style={styles.deleteButton}
            >
              <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            </TouchableOpacity>
          )}
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
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 제목 */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>제목 *</Text>
          <TextInput
            style={styles.input}
            value={job.title}
            onChangeText={function(value) { handleInputChange('title', value); }}
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
            onChangeText={function(value) { handleInputChange('company', value); }}
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
            onChangeText={function(value) { handleInputChange('location', value); }}
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
            onChangeText={function(value) { handleInputChange('description', value); }}
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
            onChangeText={function(value) { handleInputChange('requirements', value); }}
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
            onChangeText={function(value) { handleInputChange('benefits', value); }}
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
            onChangeText={function(value) { handleInputChange('contactEmail', value); }}
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
            onChangeText={function(value) { handleInputChange('tags', value); }}
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
    fontSize: 22,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginLeft: 24,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#FF3B301A',
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
export default JobEditScreen;
