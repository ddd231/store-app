import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MessageAttachment from './MessageAttachment';

/**
 * 개별 메시지 아이템 컴포넌트
 * 롱프레스로 답장, 복사, 삭제 등의 액션 제공
 */
export default function MessageItem({ 
  message, 
  isOwn, 
  username, 
  onReply, 
  onCopy, 
  onDelete,
  onPress 
}) {
  const handleLongPress = () => {
    const options = [
      { text: '답장하기', onPress: () => onReply && onReply(message) },
      { text: '복사하기', onPress: () => handleCopy() },
    ];

    // 본인 메시지인 경우 삭제 옵션 추가
    if (isOwn) {
      options.push({ 
        text: '삭제하기', 
        style: 'destructive',
        onPress: () => handleDelete() 
      });
    }

    options.push({ text: '취소', style: 'cancel' });

    Alert.alert(
      '메시지 옵션',
      '원하는 작업을 선택하세요',
      options
    );
  };

  const handleCopy = () => {
    if (onCopy) {
      onCopy(message.message || message.content || '');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      '메시지 삭제',
      '정말로 이 메시지를 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '삭제', 
          style: 'destructive',
          onPress: () => onDelete && onDelete(message)
        }
      ]
    );
  };

  const getDisplayText = () => {
    if (message.attachment) {
      return message.attachment.type === 'image' ? '📷 이미지' : '📄 문서';
    }
    return message.message || message.content || '';
  };

  const renderReplyMessage = () => {
    if (!message.reply_to) return null;

    return (
      <View style={styles.replyContainer}>
        <View style={styles.replyBar} />
        <View style={styles.replyContent}>
          <Text style={styles.replyUser}>
            {message.reply_to.username || message.reply_to.sender_name}
          </Text>
          <Text style={styles.replyText} numberOfLines={1}>
            {message.reply_to.attachment 
              ? (message.reply_to.attachment.type === 'image' ? '📷 이미지' : '📄 문서')
              : (message.reply_to.message || message.reply_to.content || '')
            }
          </Text>
        </View>
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={[
        styles.messageItem,
        isOwn ? styles.myMessage : styles.otherMessage
      ]}
      onLongPress={handleLongPress}
      onPress={onPress}
      activeOpacity={0.8}
      delayLongPress={500}
    >
      {renderReplyMessage()}
      
      <Text style={styles.messageSender}>
        {message.username || message.sender_name}:
      </Text>
      
      <Text style={styles.messageContent}>
        {getDisplayText()}
      </Text>
      
      {message.attachment && (
        <MessageAttachment 
          attachment={message.attachment}
          onPress={(attachment) => {
          }}
        />
      )}
      
      <View style={styles.messageFooter}>
        {message.timestamp && (
          <Text style={styles.timestamp}>
            {new Date(message.timestamp).toLocaleTimeString('ko-KR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
        )}
        
        {message.edited_at && (
          <Text style={styles.editedText}>수정됨</Text>
        )}
        
        {isOwn && (
          <View style={styles.messageStatus}>
            <Ionicons 
              name="checkmark-done" 
              size={12} 
              color="#007AFF" 
            />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  messageItem: {
    marginBottom: 10,
    padding: 12,
    borderRadius: 12,
    maxWidth: '80%',
    minWidth: 100,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0F0F0',
  },
  replyContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingLeft: 8,
  },
  replyBar: {
    width: 2,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 1,
    marginRight: 8,
  },
  replyContent: {
    flex: 1,
  },
  replyUser: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 2,
  },
  replyText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontStyle: 'italic',
  },
  messageSender: {
    fontWeight: 'bold',
    fontSize: 12,
    marginBottom: 4,
    color: '#333',
  },
  messageContent: {
    fontSize: 16,
    color: '#333',
    lineHeight: 20,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  timestamp: {
    fontSize: 11,
    color: '#999',
  },
  editedText: {
    fontSize: 10,
    color: '#999',
    fontStyle: 'italic',
    marginLeft: 4,
  },
  messageStatus: {
    marginLeft: 4,
  },
});