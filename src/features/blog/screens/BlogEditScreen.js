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
import { getBlogPost, createBlogPost, updateBlogPost } from '../services/blogService';

export default function BlogEditScreen({ navigation, route }) {
  const { blogId } = route.params || {};
  const [blog, setBlog] = useState({
    title: '',
    content: '',
    tags: '',
    excerpt: ''
  });
  const [loading, setLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  useEffect(function() {
    if (blogId) {
      setIsEdit(true);
      loadBlog();
    }
  }, [blogId]);

  async function loadBlog() {
    try {
      const data = await getBlogPost(blogId);
      setBlog({
        title: data.title,
        content: data.content,
        tags: data.tags ? data.tags.join(',') : '',
        excerpt: data.excerpt || ''
      });
    } catch (error) {
      console.error('블로그 로딩 오류:', error);
      Alert.alert('오류', '블로그 정보를 불러올 수 없습니다.');
    }
  };

  async function handleSave() {

    try {
      setLoading(true);
      
      const blogData = {
        title: blog.title.trim(),
        content: blog.content.trim(),
        tags: blog.tags.trim(),
        excerpt: blog.excerpt.trim() || blog.content.substring(0, 200) + '...'
      };

      if (isEdit) {
        await updateBlogPost(blogId, blogData);
      } else {
        await createBlogPost(blogData);
      }
      
      Alert.alert('성공', `블로그가 ${isEdit ? '수정' : '등록'}되었습니다.`, [
        { text: '확인', onPress: function() { navigation.goBack(); } }
      ]);
      
    } catch (error) {
      console.error('블로그 저장 오류:', error);
      Alert.alert('오류', `블로그 ${isEdit ? '수정' : '등록'}에 실패했습니다.`);
    } finally {
      setLoading(false);
    }
  };

  function handleInputChange(field, value) {
    setBlog(function(prev) { return { ...prev, [field]: value }; });
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
          <Text style={styles.label}>제목</Text>
          <TextInput
            style={styles.input}
            value={blog.title}
            onChangeText={function(value) { handleInputChange('title', value); }}
            placeholder="블로그 제목을 입력하세요"
            placeholderTextColor={theme.colors.text.placeholder}
          />
        </View>

        {/* 요약 */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>요약 (선택사항)</Text>
          <TextInput
            style={[styles.input, { height: 80 }]}
            value={blog.excerpt}
            onChangeText={function(value) { handleInputChange('excerpt', value); }}
            placeholder="블로그 요약을 입력하세요 (비워두면 자동으로 생성됩니다)"
            placeholderTextColor={theme.colors.text.placeholder}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* 내용 */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>내용</Text>
          <TextInput
            style={[styles.input, styles.contentArea]}
            value={blog.content}
            onChangeText={function(value) { handleInputChange('content', value); }}
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