import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput, Image } from 'react-native';
import { theme } from '../../../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { launchImageLibraryAsync, launchCameraAsync, MediaTypeOptions } from 'expo-image-picker';
import { uploadPaintingWork, uploadNovelWork } from '../services/workService';
import { sanitizeInput, validateImageFile, logger } from '../../../shared';
import { useLanguage } from '../../../contexts/LanguageContext';

export default function WorkUploadScreen({ navigation, route }) {
  const { t } = useLanguage();
  const workType = route?.params?.type; // 'painting' 또는 'novel'
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [novelContent, setNovelContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  async function pickImage() {
    try {
      const result = await launchImageLibraryAsync({
        mediaTypes: MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        exif: false,
        base64: true,  // base64 활성화 - 필수!
      });

      if (!result.canceled) {
        const file = result.assets[0];
        logger.log('Selected image file:', file);
        
        // 파일 보안 검증
        const validation = validateImageFile(file);
        if (!validation.isValid) {
          Alert.alert(t('fileError'), validation.error);
          return;
        }
        
        setSelectedImage(file);
      }
    } catch (error) {
      console.error('Image picker error:', error); // 에러 로그
      Alert.alert(t('error'), t('imageSelectError'));
    }
  };

  async function takePhoto() {
    try {
      const result = await launchCameraAsync({
        mediaTypes: MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        exif: false,
        base64: true,  // base64 활성화 - 필수!
      });

      if (!result.canceled) {
        const file = result.assets[0];
        logger.log('Captured photo file:', file);
        
        // 파일 보안 검증
        const validation = validateImageFile(file);
        if (!validation.isValid) {
          Alert.alert(t('fileError'), validation.error);
          return;
        }
        
        setSelectedImage(file);
      }
    } catch (error) {
      console.error('Camera error:', error); // 에러 로그
      Alert.alert(t('error'), t('photoTakeError'));
    }
  };

  function handleImageSelect() {
    Alert.alert(
      t('selectImage'),
      t('howToAddImage'),
      [
        { text: t('cancel'), style: 'cancel' },
        { text: t('selectFromGallery'), onPress: pickImage },
        { text: t('takePhoto'), onPress: takePhoto },
      ]
    );
  };

  async function handleUpload() {
    if (!title.trim()) {
      Alert.alert(t('error'), t('enterTitle'));
      return;
    }

    if (!customCategory.trim()) {
      Alert.alert(t('error'), t('enterCategory'));
      return;
    }

    if (workType === 'painting' && !selectedImage) {
      Alert.alert(t('error'), t('selectImagePlease'));
      return;
    }

    if (workType === 'novel' && !novelContent.trim()) {
      Alert.alert(t('error'), t('enterNovelContent'));
      return;
    }

    setIsUploading(true);

    try {
      let result;
      
      if (workType === 'painting') {
        logger.log('Uploading image with URI:', selectedImage.uri);
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
        t('uploadComplete'),
        t('workUploadSuccess'),
        [
          {
            text: t('confirm'),
            onPress: function() { navigation.goBack(); }
          }
        ]
      );
    } catch (error) {
      console.error('=== 업로드 상세 오류 ===');
      console.error('오류 타입:', error.name);
      console.error('오류 메시지:', error.message);
      console.error('전체 오류:', JSON.stringify(error, null, 2));
      Alert.alert('업로드 오류', `오류: ${error.message}\n\n콘솔에서 상세 로그를 확인하길 바랍니다.`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={function() { navigation.goBack(); }}>
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {workType === 'painting' ? t('uploadPainting') : t('uploadNovel')}
        </Text>
        <TouchableOpacity onPress={handleUpload} disabled={isUploading}>
          <Text style={[styles.uploadText, isUploading && styles.uploadTextDisabled]}>
            {isUploading ? t('uploading') : t('done')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 그림 업로드 - 이미지 선택 */}
        {workType === 'painting' && (
          <TouchableOpacity style={styles.imageSection} onPress={handleImageSelect}>
            {selectedImage ? (
              <Image source={{ uri: selectedImage.uri }} style={styles.selectedImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="camera-outline" size={40} color={theme.colors.text.secondary} />
                <Text style={styles.imagePlaceholderText}>{t('addImage')}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* 소설 내용 입력 - 맨 위로 */}
        {workType === 'novel' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('novelContent')}</Text>
            <TextInput
              style={[styles.textInput, styles.novelContentInput]}
              value={novelContent}
              onChangeText={setNovelContent}
              placeholder={t('novelContentPlaceholder')}
              placeholderTextColor={theme.colors.text.placeholder}
              multiline
              numberOfLines={10}
              maxLength={50000}
            />
          </View>
        )}

        {/* 제목 입력 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('workTitle')}</Text>
          <TextInput
            style={styles.textInput}
            value={title}
            onChangeText={setTitle}
            placeholder={workType === 'painting' ? t('paintingTitlePlaceholder') : t('novelTitlePlaceholder')}
            placeholderTextColor={theme.colors.text.placeholder}
            maxLength={100}
          />
        </View>

        {/* 카테고리 직접 입력 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('category')}</Text>
          <TextInput
            style={styles.textInput}
            value={customCategory}
            onChangeText={setCustomCategory}
            placeholder={workType === 'painting' ? t('paintingCategoryPlaceholder') : t('novelCategoryPlaceholder')}
            placeholderTextColor={theme.colors.text.placeholder}
            maxLength={30}
          />
        </View>

        {/* 설명 입력 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {workType === 'painting' ? t('workDescription') : t('workIntroduction')}
          </Text>
          <TextInput
            style={[styles.textInput, styles.descriptionInput]}
            value={description}
            onChangeText={setDescription}
            placeholder={workType === 'painting' ? t('workDescriptionPlaceholder') : t('workIntroductionPlaceholder')}
            placeholderTextColor={theme.colors.text.placeholder}
            multiline
            numberOfLines={4}
            maxLength={1000}
          />
        </View>

        {/* 업로드 가이드 */}
        <View style={styles.guideSection}>
          <Text style={styles.guideTitle}>{t('uploadGuide')}</Text>
          {workType === 'painting' ? (
            <>
              <Text style={styles.guideText}>{t('imageUploadGuide')}</Text>
              <Text style={styles.guideText}>{t('supportedFormats')}</Text>
            </>
          ) : (
            <Text style={styles.guideText}>{t('chapterUploadGuide')}</Text>
          )}
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
    color: '#000000',
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 120,
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
    color: '#000000',
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
    color: '#000000',
  },
  guideText: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
});

