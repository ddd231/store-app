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

export default function BlogEditScreen({ navigation, route }) {
  const { blogId } = route.params;
  const [blog, setBlog] = useState({
    title: '',
    author: '',
    date: '',
    content: '',
    tags: '',
    category: ''
  });
  const [loading, setLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    if (blogId) {
      setIsEdit(true);
      loadBlog();
    }
  }, [blogId]);

  const loadBlog = async () => {
    try {
      // 여기에 실제 블로그 데이터 로드 로직 추가
      // 현재는 더미 데이터
      setBlog({
        title: '아티스트를 위한 포트폴리오 가이드',
        author: '포트폴리오 플랫폼',
        date: new Date().toISOString().split('T')[0],
        content: '효과적인 포트폴리오 제작 방법에 대해 알아보겠습니다...',
        tags: '포트폴리오,가이드,아티스트',
        category: '튜토리얼'
      });
    } catch (error) {
      Alert.alert('오류', '블로그 정보를 불러올 수 없습니다.');
    }
  };

  const handleSave = async () => {
    if (!blog.title.trim() || !blog.content.trim()) {
      Alert.alert('입력 오류', '제목과 내용은 필수 입력 항목입니다.');
      return;
    }

    try {
      setLoading(true);
      
      // 여기에 실제 저장 로직 추가
      Alert.alert('성공', `블로그가 ${isEdit ? '수정' : '등록'}되었습니다.`, [
        { text: '확인', onPress: () => navigation.goBack() }
      ]);
      
    } catch (error) {
      Alert.alert('오류', `블로그 ${isEdit ? '수정' : '등록'}에 실패했습니다.`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setBlog(prev => ({
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
          {isEdit ? '블로그 수정' : '블로그 작성'}
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
            value={blog.title}
            onChangeText={(value) => handleInputChange('title', value)}
            placeholder="블로그 제목을 입력하세요"
            placeholderTextColor={theme.colors.text.placeholder}
          />
        </View>

        {/* 작성자 */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>작성자</Text>
          <TextInput
            style={styles.input}
            value={blog.author}
            onChangeText={(value) => handleInputChange('author', value)}
            placeholder="작성자명을 입력하세요"
            placeholderTextColor={theme.colors.text.placeholder}
          />
        </View>

        {/* 카테고리 */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>카테고리</Text>
          <TextInput
            style={styles.input}
            value={blog.category}
            onChangeText={(value) => handleInputChange('category', value)}
            placeholder="카테고리를 입력하세요"
            placeholderTextColor={theme.colors.text.placeholder}
          />
        </View>

        {/* 내용 */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>내용 *</Text>
          <TextInput
            style={[styles.input, styles.contentArea]}
            value={blog.content}
            onChangeText={(value) => handleInputChange('content', value)}
            placeholder="블로그 내용을 입력하세요"
            placeholderTextColor={theme.colors.text.placeholder}
            multiline
            numberOfLines={12}
            textAlignVertical="top"
          />
        </View>

        {/* 태그 */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>태그</Text>
          <TextInput
            style={styles.input}
            value={blog.tags}
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
  contentArea: {
    height: 200,
    paddingTop: theme.spacing.md,
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
  },
  bottomSpace: {
    height: 50,
  },
});