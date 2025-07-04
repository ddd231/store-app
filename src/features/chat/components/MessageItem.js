import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MessageAttachment from './MessageAttachment';
import { useLanguage } from '../../../contexts/LanguageContext';

/**
 * 개별 메시지 아이템 컴포넌트
 * 롱프레스로 답장, 복사, 삭제 등의 액션 제공
 * React.memo로 최적화하여 불필요한 리렌더링 방지
 */
const MessageItem = memo(function({
  message, 
  isOwn, 
  username, 
  onReply, 
  onCopy, 
  onDelete,
  onPress 
}) {
  const { t } = useLanguage();
  function handleLongPress() {
    const options = [
      { text: t('reply'), onPress: function() { onReply && onReply(message) ; }},
      { text: t('copy'), onPress: function() { handleCopy() ; }},
    ];

    // 본인 메시지인 경우 삭제 옵션 추가
    if (isOwn) {
      options.push({ 
        text: t('deleteMessage'), 
        style: 'destructive',
        onPress: function() { handleDelete(); } 
      });
    }

    options.push({ text: t('cancel'), style: 'cancel' });

    Alert.alert(
      t('messageOptions'),
      t('selectAction'),
      options
    );
  };

  function handleCopy() {
    if (onCopy) {
      onCopy(message.message || message.content || '');
    }
  };

  function handleDelete() {
    Alert.alert(
      t('deleteMessage'),
      t('confirmDeleteMessage'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('delete'), 
          style: 'destructive',
          onPress: function() { onDelete && onDelete(message); }
        }
      ]
    );
  };

  function getDisplayText() {
    if (message.attachment) {
      return message.attachment.type === 'image' ? `📷 ${t('image')}` : `📄 ${t('document')}`;
    }
    return message.message || message.content || '';
  };

  function renderReplyMessage() {
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
              ? (message.reply_to.attachment.type === 'image' ? `📷 ${t('image')}` : `📄 ${t('document')}`)
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
          onPress={function(attachment) {
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
          <Text style={styles.editedText}>{t('edited')}</Text>
        )}
        
      </View>
    </TouchableOpacity>
  );
});

export default MessageItem;

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
    backgroundColor: '#87CEEB',
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

MessageItem.displayName = 'MessageItem';