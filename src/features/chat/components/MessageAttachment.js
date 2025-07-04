import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Linking, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatFileSize, getFileTypeIcon } from '../../../shared';

const { width: screenWidth } = Dimensions.get('window');
const imageMaxWidth = screenWidth * 0.6;

/**
 * 메시지 첨부파일 표시 컴포넌트
 * 이미지, 문서 등 다양한 파일 타입 지원
 */
function MessageAttachment({ attachment, onPress }) {
  if (!attachment) return null;

  function handlePress() {
    if (onPress) {
      onPress(attachment);
    } else {
      // 기본 동작: 파일 URL 열기
      if (attachment.url) {
        Linking.openURL(attachment.url).catch(function(error) {
          console.error('[MessageAttachment] URL 열기 오류:', error);
        });
      }
    }
  };

  // 이미지 첨부파일 렌더링
  if (attachment.type === 'image') {
    return (
      <TouchableOpacity 
        style={styles.imageContainer} 
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <Image 
          source={{ uri: attachment.url }}
          style={styles.image}
          resizeMode="cover"
        />
        {attachment.name && (
          <Text style={styles.imageName} numberOfLines={1}>
            {attachment.name}
          </Text>
        )}
      </TouchableOpacity>
    );
  }

  // 문서 첨부파일 렌더링
  if (attachment.type === 'document') {
    const iconName = getFileTypeIcon(attachment.mimeType || 'application/octet-stream');
    
    return (
      <TouchableOpacity 
        style={styles.documentContainer} 
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <View style={styles.documentIcon}>
          <Ionicons name={iconName} size={32} color="#007AFF" />
        </View>
        <View style={styles.documentInfo}>
          <Text style={styles.documentName} numberOfLines={2}>
            {attachment.name || '알 수 없는 파일'}
          </Text>
          {attachment.size && (
            <Text style={styles.documentSize}>
              {formatFileSize(attachment.size)}
            </Text>
          )}
        </View>
        <Ionicons name="download" size={20} color="#007AFF" />
      </TouchableOpacity>
    );
  }

  // 기타 파일 타입
  return (
    <TouchableOpacity 
      style={styles.fileContainer} 
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View style={styles.fileIcon}>
        <Ionicons name="document-attach" size={24} color="#666" />
      </View>
      <View style={styles.fileInfo}>
        <Text style={styles.fileName} numberOfLines={1}>
          {attachment.name || '첨부파일'}
        </Text>
        {attachment.size && (
          <Text style={styles.fileSize}>
            {formatFileSize(attachment.size)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // 이미지 첨부파일 스타일
  imageContainer: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
    maxWidth: imageMaxWidth,
  },
  image: {
    width: '100%',
    height: 200,
    backgroundColor: '#F0F0F0',
  },
  imageName: {
    padding: 8,
    fontSize: 12,
    color: '#666',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  
  // 문서 첨부파일 스타일
  documentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    maxWidth: imageMaxWidth,
  },
  documentIcon: {
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
    marginRight: 8,
  },
  documentName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  documentSize: {
    fontSize: 12,
    color: '#666',
  },
  
  // 기타 파일 스타일
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    maxWidth: imageMaxWidth,
  },
  fileIcon: {
    marginRight: 10,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  fileSize: {
    fontSize: 12,
    color: '#666',
  },
});

export default MessageAttachment;
