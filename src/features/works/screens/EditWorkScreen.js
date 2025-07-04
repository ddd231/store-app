import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Image } from 'react-native';
import { theme } from '../../../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../shared';

export default function EditWorkScreen({ navigation, route }) {
  const { workId } = route.params;
  const [work, setWork] = useState(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(function() {
    loadWorkData();
  }, [workId]);

  async function loadWorkData() {
    try {
      const { data: workData, error } = await supabase
        .from('works')
        .select('*')
        .eq('id', workId)
        .single();

      if (error) throw error;

      setWork(workData);
      setTitle(workData.title);
      setCategory(workData.category || '');
      setContent(workData.content || '');
    } catch (error) {
      console.error('작품 로드 오류:', error);
      Alert.alert('오류', '작품을 불러올 수 없습니다.');
      navigation.goBack();
    }
  };

  async function handleUpdateWork() {
    if (!title.trim()) {
      Alert.alert('알림', '작품 제목을 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('works')
        .update({
          title: title,
          category: category,
          content: content,
          updated_at: new Date().toISOString()
        })
        .eq('id', workId);

      if (error) throw error;

      Alert.alert('성공', '작품이 수정되었습니다.');
      navigation.goBack();
    } catch (error) {
      console.error('작품 수정 오류:', error);
      Alert.alert('오류', '작품 수정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  function handleDeleteWork() {
    Alert.alert(
      '작품 삭제',
      '정말로 이 작품을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { text: '삭제', style: 'destructive', onPress: deleteWork }
      ]
    );
  };

  async function deleteWork() {
    try {
      const { error } = await supabase
        .from('works')
        .delete()
        .eq('id', workId);

      if (error) throw error;

      Alert.alert('성공', '작품이 삭제되었습니다.');
      navigation.goBack();
      navigation.goBack();
    } catch (error) {
      console.error('작품 삭제 오류:', error);
      Alert.alert('오류', '작품 삭제에 실패했습니다.');
    }
  };

  if (!work) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>로딩 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={function() { navigation.goBack(); }}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>작품 편집</Text>
        <TouchableOpacity onPress={handleDeleteWork}>
          <Ionicons name="trash-outline" size={24} color={theme.colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 이미지 미리보기 (그림 작품인 경우) */}
        {work.type === 'painting' && work.image_url && (
          <View style={styles.imagePreview}>
            <Image source={{ uri: work.image_url }} style={styles.previewImage} resizeMode="contain" />
          </View>
        )}

        {/* 작품 정보 편집 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>작품 제목</Text>
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder="작품 제목을 입력하세요"
            maxLength={100}
            placeholderTextColor={theme.colors.text.secondary}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>카테고리</Text>
          <TextInput
            style={styles.categoryInput}
            value={category}
            onChangeText={setCategory}
            placeholder="카테고리를 입력하세요 (예: 풍경화, 소설 등)"
            maxLength={50}
            placeholderTextColor={theme.colors.text.secondary}
          />
        </View>

        {/* 소설인 경우 내용 편집 */}
        {work.type === 'novel' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>작품 내용</Text>
            <TextInput
              style={styles.contentInput}
              value={content}
              onChangeText={setContent}
              placeholder="작품 내용을 입력하세요"
              multiline
              numberOfLines={10}
              placeholderTextColor={theme.colors.text.secondary}
              textAlignVertical="top"
              maxLength={10000}
            />
            <Text style={styles.characterCount}>
              {content.length}/10,000자
            </Text>
          </View>
        )}
      </ScrollView>

      {/* 저장 버튼 */}
      <View style={styles.bottomSection}>
        <TouchableOpacity 
          style={[styles.saveButton, loading && styles.saveButtonDisabled]} 
          onPress={handleUpdateWork}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? '저장 중...' : '변경사항 저장'}
          </Text>
        </TouchableOpacity>
      </View>
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
    paddingVertical: theme.spacing.md,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  headerTitle: {
    ...theme.typography.heading,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 200,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
  },
  imagePreview: {
    padding: theme.spacing.lg,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: theme.borderRadius.medium,
  },
  section: {
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  sectionTitle: {
    ...theme.typography.body,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  titleInput: {
    ...theme.typography.body,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.medium,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: 'white',
  },
  categoryInput: {
    ...theme.typography.body,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.medium,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: 'white',
  },
  contentInput: {
    ...theme.typography.body,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.medium,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: 'white',
    height: 200,
  },
  characterCount: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    textAlign: 'right',
    marginTop: theme.spacing.sm,
  },
  bottomSection: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl + 50,
    backgroundColor: theme.colors.background,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: theme.colors.text.secondary,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

