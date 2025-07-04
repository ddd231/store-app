import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Alert, ActionSheetIOS, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { takePicture, pickImage, pickDocument } from '../../services/fileUploadService';
import { validateImageFile, validateDocumentFile } from '../utils/fileValidator';

/**
 * 파일 업로드 버튼 컴포넌트
 * 이미지 촬영, 갤러리 선택, 문서 선택 기능 제공
 */
function FileUploadButton({ onFileSelected, disabled = false, size = 30, color = '#007AFF' }) {
  const [isUploading, setIsUploading] = useState(false);

  function showFileOptions() {
    if (disabled || isUploading) return;

    const options = [
      { text: '카메라로 촬영', onPress: handleTakePicture },
      { text: '갤러리에서 선택', onPress: handlePickImage },
      { text: '문서 선택', onPress: handlePickDocument },
      { text: '취소', style: 'cancel' }
    ];

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: options.map(function(option) { return option.text; }),
          cancelButtonIndex: options.length - 1,
        },
        function(buttonIndex) {
          if (buttonIndex < options.length - 1) {
            options[buttonIndex].onPress();
          }
        }
      );
    } else {
      Alert.alert(
        '파일 업로드',
        '업로드할 파일 유형을 선택하세요',
        options
      );
    }
  };

  async function handleTakePicture() {
    setIsUploading(true);
    try {
      const result = await takePicture();
      if (result.success) {
        // 파일 보안 검증
        const validation = validateImageFile(result.file);
        if (!validation.isValid) {
          Alert.alert('파일 오류', validation.error);
          return;
        }
        onFileSelected(result.file, 'image');
      } else {
        Alert.alert('오류', result.error);
      }
    } catch (error) {
      console.error('[FileUploadButton] 카메라 촬영 오류:', error);
      Alert.alert('오류', '카메라 촬영 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  async function handlePickImage() {
    setIsUploading(true);
    try {
      const result = await pickImage();
      if (result.success) {
        // 파일 보안 검증
        const validation = validateImageFile(result.file);
        if (!validation.isValid) {
          Alert.alert('파일 오류', validation.error);
          return;
        }
        onFileSelected(result.file, 'image');
      } else {
        Alert.alert('오류', result.error);
      }
    } catch (error) {
      console.error('[FileUploadButton] 이미지 선택 오류:', error);
      Alert.alert('오류', '이미지 선택 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  async function handlePickDocument() {
    setIsUploading(true);
    try {
      const result = await pickDocument();
      if (result.success) {
        // 파일 보안 검증
        const validation = validateDocumentFile(result.file);
        if (!validation.isValid) {
          Alert.alert('파일 오류', validation.error);
          return;
        }
        onFileSelected(result.file, 'document');
      } else {
        Alert.alert('오륙', result.error);
      }
    } catch (error) {
      console.error('[FileUploadButton] 문서 선택 오류:', error);
      Alert.alert('오류', '문서 선택 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        disabled && styles.buttonDisabled,
        isUploading && styles.buttonUploading
      ]}
      onPress={showFileOptions}
      disabled={disabled || isUploading}
      activeOpacity={0.7}
    >
      <Ionicons 
        name={isUploading ? "cloud-upload" : "attach"} 
        size={size} 
        color={disabled ? '#CCC' : color} 
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonUploading: {
    backgroundColor: '#F0F0F0',
  },
});

export default FileUploadButton;