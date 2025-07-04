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
import { getContest, createContest, updateContest, deleteContest } from '../services/contestService';
import { checkPremiumOrAdminAccess } from '../../../shared';
import { useAuth } from '../../auth/hooks/useAuth';

function ContestEditScreen({ navigation, route }) {
  const { contestId } = route.params || {};
  const { user } = useAuth();
  const [contest, setContest] = useState({
    title: '',
    organizer: '',
    startDate: '',
    endDate: '',
    prize: '',
    description: '',
    requirements: '',
    submissionGuidelines: '',
    contactEmail: '',
    tags: ''
  });
  const [loading, setLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  useEffect(function() {
    checkAccessPermission();
  }, [user]);

  useEffect(function() {
    if (contestId) {
      setIsEdit(true);
      loadContest();
    }
  }, [contestId]);

  function checkAccessPermission() {
    if (!user) {
      navigation.goBack();
      return;
    }

    if (!checkPremiumOrAdminAccess(user)) {
      Alert.alert(
        '전문가 멤버십 필요',
        '컨테스트 게시판 업로드는 전문가 멤버십 전용 기능입니다.',
        [
          { text: '취소', onPress: function() { navigation.goBack(); }},
          { text: '업그레이드', onPress: function() { navigation.navigate('Upgrade'); } }
        ]
      );
      return;
    }
  };

  async function loadContest() {
    try {
      const data = await getContest(contestId);
      setContest({
        title: data.title,
        organizer: data.organizer,
        startDate: data.start_date ? new Date(data.start_date).toISOString().split('T')[0] : '',
        endDate: data.end_date ? new Date(data.end_date).toISOString().split('T')[0] : '',
        prize: data.prize || '',
        description: data.description || '',
        requirements: data.requirements || '',
        submissionGuidelines: data.submission_guidelines || '',
        contactEmail: data.contact_email || '',
        tags: data.tags ? data.tags.join(',') : ''
      });
    } catch (error) {
      console.error('컨테스트 로딩 오류:', error);
      Alert.alert('오류', '컨테스트 정보를 불러올 수 없습니다.');
    }
  };

  async function handleSave() {
    if (!contest.title.trim() || !contest.organizer.trim()) {
      Alert.alert('입력 오류', '제목과 주최자는 필수 입력 항목입니다.');
      return;
    }

    // 이메일 형식 검증 (입력된 경우에만)
    if (contest.contactEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contest.contactEmail)) {
        Alert.alert('입력 오류', '올바른 이메일 형식을 입력해주세요.');
        return;
      }
    }

    try {
      setLoading(true);
      
      const contestData = {
        title: contest.title.trim(),
        organizer: contest.organizer.trim(),
        startDate: contest.startDate,
        endDate: contest.endDate,
        prize: contest.prize.trim(),
        description: contest.description.trim(),
        requirements: contest.requirements.trim(),
        submissionGuidelines: contest.submissionGuidelines.trim(),
        contactEmail: contest.contactEmail.trim(),
        tags: contest.tags.trim()
      };

      if (isEdit) {
        await updateContest(contestId, contestData);
      } else {
        await createContest(contestData);
      }
      
      Alert.alert('성공', `컨테스트가 ${isEdit ? '수정' : '등록'}되었습니다.`, [
        { text: '확인', onPress: function() { navigation.goBack(); } }
      ]);
      
    } catch (error) {
      console.error('컨테스트 저장 오류:', error);
      Alert.alert('오류', `컨테스트 ${isEdit ? '수정' : '등록'}에 실패했습니다.`);
    } finally {
      setLoading(false);
    }
  };

  function handleInputChange(field, value) {
    setContest(function(prev) { return ({
      ...prev,
      [field]: value
    }); });
  };

  async function handleDelete() {
    Alert.alert(
      '컨테스트 삭제',
      '정말로 이 컨테스트를 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async function() {
            try {
              setLoading(true);
              await deleteContest(contestId);
              Alert.alert('삭제 완료', '컨테스트가 삭제되었습니다.', [
                { text: '확인', onPress: function() { navigation.goBack(); } }
              ]);
            } catch (error) {
              console.error('컨테스트 삭제 오류:', error);
              Alert.alert('오류', '컨테스트 삭제에 실패했습니다.');
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
          {isEdit ? '콘테스트 수정' : '콘테스트 등록'}
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
          <Text style={styles.label}>제목</Text>
          <TextInput
            style={styles.input}
            value={contest.title}
            onChangeText={function(value) { handleInputChange('title', value); }}
            placeholder="콘테스트 제목을 입력하세요"
            placeholderTextColor={theme.colors.text.placeholder}
          />
        </View>

        {/* 주최자 */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>주최자</Text>
          <TextInput
            style={styles.input}
            value={contest.organizer}
            onChangeText={function(value) { handleInputChange('organizer', value); }}
            placeholder="주최자명을 입력하세요"
            placeholderTextColor={theme.colors.text.placeholder}
          />
        </View>

        {/* 시작일 */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>시작일</Text>
          <TextInput
            style={styles.input}
            value={contest.startDate}
            onChangeText={function(value) { handleInputChange('startDate', value); }}
            placeholder="YYYY-MM-DD 형식으로 입력하세요"
            placeholderTextColor={theme.colors.text.placeholder}
          />
        </View>

        {/* 종료일 */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>종료일</Text>
          <TextInput
            style={styles.input}
            value={contest.endDate}
            onChangeText={function(value) { handleInputChange('endDate', value); }}
            placeholder="YYYY-MM-DD 형식으로 입력하세요"
            placeholderTextColor={theme.colors.text.placeholder}
          />
        </View>

        {/* 상금 */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>상금</Text>
          <TextInput
            style={styles.input}
            value={contest.prize}
            onChangeText={function(value) { handleInputChange('prize', value); }}
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
            onChangeText={function(value) { handleInputChange('description', value); }}
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
            onChangeText={function(value) { handleInputChange('requirements', value); }}
            placeholder="참가 요건을 입력하세요"
            placeholderTextColor={theme.colors.text.placeholder}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* 제출 가이드라인 */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>제출 가이드라인</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={contest.submissionGuidelines}
            onChangeText={function(value) { handleInputChange('submissionGuidelines', value); }}
            placeholder="제출 방법 및 가이드라인을 입력하세요"
            placeholderTextColor={theme.colors.text.placeholder}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* 연락처 이메일 */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>연락처 이메일</Text>
          <TextInput
            style={styles.input}
            value={contest.contactEmail}
            onChangeText={function(value) { handleInputChange('contactEmail', value); }}
            placeholder="문의 이메일을 입력하세요"
            placeholderTextColor={theme.colors.text.placeholder}
            keyboardType="email-address"
          />
        </View>

        {/* 태그 */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>태그</Text>
          <TextInput
            style={styles.input}
            value={contest.tags}
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
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: theme.spacing.md,
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
export default ContestEditScreen;
