import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput, Image } from 'react-native';
import { theme } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { launchImageLibraryAsync, launchCameraAsync } from 'expo-image-picker';
import { uploadPaintingWork, uploadNovelWork } from '../services/workService';
import { sanitizeInput } from '../utils/sanitizer';
import { validateImageFile } from '../utils/fileValidator';

export default function WorkUploadScreen({ navigation, route }) {
  const workType = route?.params?.type; // 'painting' 또는 'novel'
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [novelContent, setNovelContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const pickImage = async () => {
    try {
      const result = await launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled) {
        const file = result.assets[0];
        
        // 파일 보안 검증
        const validation = validateImageFile(file);
        if (!validation.isValid) {
          Alert.alert('파일 오류', validation.error);
          return;
        }
        
        setSelectedImage(file);
      }
    } catch (error) {
      Alert.alert('오류', '이미지를 선택할 수 없습니다.');
    }
  };

  const takePhoto = async () => {
    try {
      const result = await launchCameraAsync({
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled) {
        const file = result.assets[0];
        
        // 파일 보안 검증
        const validation = validateImageFile(file);
        if (!validation.isValid) {
          Alert.alert('파일 오류', validation.error);
          return;
        }
        
        setSelectedImage(file);
      }
    } catch (error) {
      Alert.alert('오류', '사진을 촬영할 수 없습니다.');
    }
  };

  const handleImageSelect = () => {
    Alert.alert(
      '이미지 선택',
      '어떤 방법으로 이미지를 추가하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { text: '갤러리에서 선택', onPress: pickImage },
        { text: '카메라로 촬영', onPress: takePhoto },
      ]
    );
  };

  const handleUpload = async () => {
    if (!title.trim()) {
      Alert.alert('오류', '제목을 입력해주세요.');
      return;
    }

    if (!customCategory.trim()) {
      Alert.alert('오류', '카테고리를 입력해주세요.');
      return;
    }

    if (workType === 'painting' && !selectedImage) {
      Alert.alert('오류', '이미지를 선택해주세요.');
      return;
    }

    if (workType === 'novel' && !novelContent.trim()) {
      Alert.alert('오류', '소설 내용을 입력해주세요.');
      return;
    }

    setIsUploading(true);

    try {
      let result;
      
      if (workType === 'painting') {
        result = await uploadPaintingWork({
          title: sanitizeInput(title),
          description: sanitizeInput(description),
          category: sanitizeInput(customCategory),
          imageUri: selectedImage.uri
        });
      } else {
        result = await uploadNovelWork({
          title: sanitizeInput(title),
          description: sanitizeInput(description),
          category: sanitizeInput(customCategory),
          content: sanitizeInput(novelContent)
        });
      }
      
      Alert.alert(
        '업로드 완료',
        `${workType === 'painting' ? '그림' : '소설'} 작품이 성공적으로 업로드되었습니다!`,
        [
          {
            text: '확인',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('업로드 오류:', error);
      Alert.alert('오류', __DEV__ ? (error.message || '업로드 중 문제가 발생했습니다.') : '업로드 중 문제가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {workType === 'painting' ? '그림 업로드' : '소설 업로드'}
        </Text>
        <TouchableOpacity onPress={handleUpload} disabled={isUploading}>
          <Text style={[styles.uploadText, isUploading && styles.uploadTextDisabled]}>
            {isUploading ? '업로드중...' : '완료'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 그림 업로드 - 이미지 선택 */}
        {workType === 'painting' && (
          <TouchableOpacity style={styles.imageSection} onPress={handleImageSelect}>
            {selectedImage ? (
              <Image source={{ uri: selectedImage.uri }} style={styles.selectedImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="camera-outline" size={40} color={theme.colors.text.secondary} />
                <Text style={styles.imagePlaceholderText}>이미지 추가</Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* 소설 내용 입력 - 맨 위로 */}
        {workType === 'novel' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>소설 내용</Text>
            <TextInput
              style={[styles.textInput, styles.novelContentInput]}
              value={novelContent}
              onChangeText={setNovelContent}
              placeholder="소설 내용을 입력하세요..."
              placeholderTextColor={theme.colors.text.placeholder}
              multiline
              numberOfLines={10}
              maxLength={50000}
            />
          </View>
        )}

        {/* 제목 입력 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>제목</Text>
          <TextInput
            style={styles.textInput}
            value={title}
            onChangeText={setTitle}
            placeholder={workType === 'painting' ? '그림 제목을 입력하세요' : '소설 제목을 입력하세요'}
            placeholderTextColor={theme.colors.text.placeholder}
            maxLength={100}
          />
        </View>

        {/* 카테고리 직접 입력 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>카테고리</Text>
          <TextInput
            style={styles.textInput}
            value={customCategory}
            onChangeText={setCustomCategory}
            placeholder={workType === 'painting' ? '예: 디지털아트, 수채화, 유화 등' : '예: 판타지, 로맨스, 추리 등'}
            placeholderTextColor={theme.colors.text.placeholder}
            maxLength={30}
          />
        </View>

        {/* 설명 입력 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {workType === 'painting' ? '작품 설명' : '작품 소개'}
          </Text>
          <TextInput
            style={[styles.textInput, styles.descriptionInput]}
            value={description}
            onChangeText={setDescription}
            placeholder={workType === 'painting' ? '작품에 대한 설명을 입력하세요' : '작품 소개나 작가의 말을 입력하세요'}
            placeholderTextColor={theme.colors.text.placeholder}
            multiline
            numberOfLines={4}
            maxLength={1000}
          />
        </View>

        {/* 업로드 가이드 */}
        <View style={styles.guideSection}>
          <Text style={styles.guideTitle}>업로드 가이드</Text>
          {workType === 'painting' ? (
            <>
              <Text style={styles.guideText}>• 이미지는 최대 10MB까지 업로드 가능합니다</Text>
              <Text style={styles.guideText}>• JPG, PNG 형식만 지원됩니다</Text>
              <Text style={styles.guideText}>• 저작권이 있는 작품은 업로드하지 마세요</Text>
            </>
          ) : (
            <>
              <Text style={styles.guideText}>• 텍스트 길이에 제한은 없습니다</Text>
              <Text style={styles.guideText}>• 저작권이 있는 작품은 업로드하지 마세요</Text>
              <Text style={styles.guideText}>• 챕터별로 나누어 업로드할 수 있습니다</Text>
            </>
          )}
          <Text style={styles.guideText}>• 적절하지 않은 내용은 삭제될 수 있습니다</Text>
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
  uploadText: {
    ...theme.typography.body,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  uploadTextDisabled: {
    color: theme.colors.text.secondary,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  imageSection: {
    marginVertical: theme.spacing.lg,
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: theme.borderRadius.medium,
    resizeMode: 'contain',
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.medium,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
  },
  imagePlaceholderText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.sm,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    ...theme.typography.body,
    fontWeight: '600',
    marginBottom: theme.spacing.md,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: 'transparent',
  },
  categoryButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  categoryText: {
    ...theme.typography.body,
    marginLeft: theme.spacing.sm,
    color: theme.colors.text.primary,
  },
  categoryTextActive: {
    color: 'white',
  },
  textInput: {
    ...theme.typography.body,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.medium,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: 'transparent',
  },
  descriptionInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  novelContentInput: {
    height: 200,
    textAlignVertical: 'top',
  },
  guideSection: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.medium,
    marginBottom: theme.spacing.xl,
  },
  guideTitle: {
    ...theme.typography.body,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  guideText: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
});