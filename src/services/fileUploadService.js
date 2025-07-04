import { 
  requestCameraPermissionsAsync,
  launchCameraAsync,
  MediaTypeOptions,
  requestMediaLibraryPermissionsAsync,
  launchImageLibraryAsync
} from 'expo-image-picker';
import { getDocumentAsync } from 'expo-document-picker';
import { supabase } from '../shared';
import { Platform } from 'react-native';

/**
 * 파일 업로드 서비스
 * 이미지, 문서 업로드 및 Supabase Storage 관리
 */

// 허용된 이미지 파일 타입
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

// 허용된 문서 파일 타입
const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

// 최대 파일 크기 (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * 카메라에서 이미지 촬영
 * @returns {Promise<Object>} - 선택된 이미지 정보
 */
export async function takePicture() {
  try {
    // 카메라 권한 요청
    const permissionResult = await requestCameraPermissionsAsync();
    
    if (!permissionResult.granted) {
      return { 
        success: false, 
        error: '카메라 권한이 필요합니다.' 
      };
    }

    // 카메라로 사진 촬영
    const result = await launchCameraAsync({
      mediaTypes: MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: false
    });

    if (result.canceled) {
      return { success: false, error: '사진 촬영이 취소되었습니다.' };
    }

    const asset = result.assets[0];
    
    // 파일 크기 검증
    if (asset.fileSize && asset.fileSize > MAX_FILE_SIZE) {
      return {
        success: false,
        error: '파일 크기가 너무 큽니다. 10MB 이하로 선택해주세요.'
      };
    }

    return {
      success: true,
      file: {
        uri: asset.uri,
        name: asset.fileName || `camera_${Date.now()}.jpg`,
        type: asset.mimeType || 'image/jpeg',
        size: asset.fileSize || 0
      }
    };
  } catch (error) {
    console.error('[FileUpload] 카메라 촬영 오류:', error);
    return {
      success: false,
      error: '카메라 촬영 중 오류가 발생했습니다.'
    };
  }
};

/**
 * 갤러리에서 이미지 선택
 * @returns {Promise<Object>} - 선택된 이미지 정보
 */
export async function pickImage() {
  try {
    // 미디어 라이브러리 권한 요청
    const permissionResult = await requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      return { 
        success: false, 
        error: '갤러리 접근 권한이 필요합니다.' 
      };
    }

    // 이미지 선택
    const result = await launchImageLibraryAsync({
      mediaTypes: MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: false
    });

    if (result.canceled) {
      return { success: false, error: '이미지 선택이 취소되었습니다.' };
    }

    const asset = result.assets[0];
    
    // 파일 타입 검증
    if (asset.mimeType && !ALLOWED_IMAGE_TYPES.includes(asset.mimeType)) {
      return {
        success: false,
        error: '지원되지 않는 이미지 형식입니다. (JPEG, PNG, GIF, WebP만 지원)'
      };
    }

    // 파일 크기 검증
    if (asset.fileSize && asset.fileSize > MAX_FILE_SIZE) {
      return {
        success: false,
        error: '파일 크기가 너무 큽니다. 10MB 이하로 선택해주세요.'
      };
    }

    return {
      success: true,
      file: {
        uri: asset.uri,
        name: asset.fileName || `image_${Date.now()}.jpg`,
        type: asset.mimeType || 'image/jpeg',
        size: asset.fileSize || 0
      }
    };
  } catch (error) {
    console.error('[FileUpload] 이미지 선택 오류:', error);
    return {
      success: false,
      error: '이미지 선택 중 오류가 발생했습니다.'
    };
  }
};

/**
 * 문서 파일 선택
 * @returns {Promise<Object>} - 선택된 문서 정보
 */
export async function pickDocument() {
  try {
    const result = await getDocumentAsync({
      type: ALLOWED_DOCUMENT_TYPES,
      copyToCacheDirectory: true,
      multiple: false
    });

    if (result.canceled) {
      return { success: false, error: '문서 선택이 취소되었습니다.' };
    }

    const asset = result.assets[0];
    
    // 파일 크기 검증
    if (asset.size && asset.size > MAX_FILE_SIZE) {
      return {
        success: false,
        error: '파일 크기가 너무 큽니다. 10MB 이하로 선택해주세요.'
      };
    }

    return {
      success: true,
      file: {
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType,
        size: asset.size || 0
      }
    };
  } catch (error) {
    console.error('[FileUpload] 문서 선택 오류:', error);
    return {
      success: false,
      error: '문서 선택 중 오류가 발생했습니다.'
    };
  }
};

/**
 * Supabase Storage에 파일 업로드
 * @param {Object} file - 업로드할 파일 정보
 * @param {string} bucket - 스토리지 버킷 이름
 * @param {string} folder - 폴더 경로 (선택사항)
 * @returns {Promise<Object>} - 업로드 결과
 */
export async function uploadFileToStorage(file, bucket = 'chat-files', folder = 'uploads') {
  try {
    if (!file || !file.uri) {
      throw new Error('유효하지 않은 파일입니다.');
    }

    // 파일 이름에 타임스탬프 추가하여 중복 방지 + 경로 조작 방지
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    // 파일명에서 위험한 문자 제거
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 50);
    const fileName = `${timestamp}_${safeName}`;
    // 폴더명도 안전하게 처리
    const safeFolder = folder ? folder.replace(/[^a-zA-Z0-9_-]/g, '_') : 'uploads';
    const filePath = `${safeFolder}/${fileName}`;

    // 파일을 Blob으로 변환 (웹/모바일 호환)
    let fileBlob;
    if (Platform.OS === 'web') {
      // 웹에서는 fetch로 파일 가져오기
      const response = await fetch(file.uri);
      fileBlob = await response.blob();
    } else {
      // React Native에서는 파일 URI 직접 사용
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        type: file.type,
        name: fileName
      });
      
      // FormData를 Blob으로 변환
      fileBlob = formData;
    }

    // Supabase Storage에 업로드
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, fileBlob, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      });

    if (error) {
      throw error;
    }

    // 공개 URL 생성
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return {
      success: true,
      file: {
        path: data.path,
        url: urlData.publicUrl,
        name: fileName,
        originalName: file.name,
        type: file.type,
        size: file.size
      }
    };
  } catch (error) {
    console.error('[FileUpload] Supabase 업로드 오류:', error);
    return {
      success: false,
      error: `파일 업로드 실패: ${error.message}`
    };
  }
};

/**
 * 메시지에 첨부파일로 이미지 업로드
 * @param {string} roomId - 채팅방 ID
 * @param {Object} file - 업로드할 파일
 * @returns {Promise<Object>} - 업로드 결과
 */
export async function uploadImageMessage(roomId, file) {
  try {
    // 이미지를 chat-images 버킷에 업로드
    const uploadResult = await uploadFileToStorage(file, 'chat-images', `rooms/${roomId}`);
    
    if (!uploadResult.success) {
      return uploadResult;
    }

    return {
      success: true,
      attachment: {
        type: 'image',
        url: uploadResult.file.url,
        name: uploadResult.file.originalName,
        size: uploadResult.file.size
      }
    };
  } catch (error) {
    console.error('[FileUpload] 이미지 메시지 업로드 오류:', error);
    return {
      success: false,
      error: '이미지 업로드 중 오류가 발생했습니다.'
    };
  }
};

/**
 * 메시지에 첨부파일로 문서 업로드
 * @param {string} roomId - 채팅방 ID  
 * @param {Object} file - 업로드할 파일
 * @returns {Promise<Object>} - 업로드 결과
 */
export async function uploadDocumentMessage(roomId, file) {
  try {
    // 문서를 chat-documents 버킷에 업로드
    const uploadResult = await uploadFileToStorage(file, 'chat-documents', `rooms/${roomId}`);
    
    if (!uploadResult.success) {
      return uploadResult;
    }

    return {
      success: true,
      attachment: {
        type: 'document',
        url: uploadResult.file.url,
        name: uploadResult.file.originalName,
        size: uploadResult.file.size
      }
    };
  } catch (error) {
    console.error('[FileUpload] 문서 메시지 업로드 오류:', error);
    return {
      success: false,
      error: '문서 업로드 중 오류가 발생했습니다.'
    };
  }
};

/**
 * 사용자 아바타 이미지 업로드
 * @param {string} userId - 사용자 ID
 * @param {Object} file - 업로드할 이미지 파일
 * @returns {Promise<Object>} - 업로드 결과
 */
export async function uploadUserAvatar(userId, file) {
  try {
    // 아바타를 avatars 버킷에 업로드
    const uploadResult = await uploadFileToStorage(file, 'avatars', 'users');
    
    if (!uploadResult.success) {
      return uploadResult;
    }

    // 사용자 프로필에 아바타 URL 업데이트
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        avatar_url: uploadResult.file.url,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      throw updateError;
    }

    return {
      success: true,
      avatarUrl: uploadResult.file.url
    };
  } catch (error) {
    console.error('[FileUpload] 아바타 업로드 오류:', error);
    return {
      success: false,
      error: '아바타 업로드 중 오류가 발생했습니다.'
    };
  }
};

/**
 * 파일 삭제
 * @param {string} bucket - 스토리지 버킷 이름
 * @param {string} path - 파일 경로
 * @returns {Promise<Object>} - 삭제 결과
 */
export async function deleteFile(bucket, path) {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('[FileUpload] 파일 삭제 오류:', error);
    return {
      success: false,
      error: '파일 삭제 중 오류가 발생했습니다.'
    };
  }
};

/**
 * 파일 크기를 읽기 쉬운 형태로 변환
 * @param {number} bytes - 바이트 크기
 * @returns {string} - 포맷된 파일 크기
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * 파일 타입에 따른 아이콘 이름 반환
 * @param {string} mimeType - 파일 MIME 타입
 * @returns {string} - Ionicons 아이콘 이름
 */
export function getFileTypeIcon(mimeType) {
  if (mimeType.startsWith('image/')) {
    return 'image';
  } else if (mimeType === 'application/pdf') {
    return 'document-text';
  } else if (mimeType.includes('word')) {
    return 'document';
  } else if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
    return 'grid';
  } else {
    return 'document-attach';
  }
};

export default {
  takePicture,
  pickImage,
  pickDocument,
  uploadFileToStorage,
  uploadImageMessage,
  uploadDocumentMessage,
  uploadUserAvatar,
  deleteFile,
  formatFileSize,
  getFileTypeIcon
};