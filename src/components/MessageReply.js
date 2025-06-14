import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * 메시지 답장 UI 컴포넌트
 * 답장할 메시지의 미리보기를 표시
 */
export default function MessageReply({ replyTo, onCancel }) {
  if (!replyTo) return null;

  const getDisplayText = (message) => {
    if (message.attachment) {
      return message.attachment.type === 'image' ? '📷 이미지' : '📄 문서';
    }
    return message.message || message.content || '';
  };

  return (
    <View style={styles.container}>
      <View style={styles.replyBar} />
      <View style={styles.content}>
        <View style={styles.header}>
          <Ionicons name="return-up-forward" size={16} color="#007AFF" />
          <Text style={styles.replyToText}>
            {replyTo.username || replyTo.sender_name}님에게 답장
          </Text>
        </View>
        <Text style={styles.messageText} numberOfLines={2}>
          {getDisplayText(replyTo)}
        </Text>
      </View>
      <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
        <Ionicons name="close" size={20} color="#666" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'flex-start',
  },
  replyBar: {
    width: 3,
    backgroundColor: '#007AFF',
    borderRadius: 2,
    marginRight: 12,
    alignSelf: 'stretch',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  replyToText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
    marginLeft: 4,
  },
  messageText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  cancelButton: {
    padding: 4,
    marginLeft: 8,
  },
});