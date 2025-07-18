import { useState, useCallback } from 'react';
import { Alert, Keyboard } from 'react-native';
import { supabase, sanitizeInput, RateLimitedActions } from '../../../shared';
import { uploadImageMessage, uploadDocumentMessage } from '../../../services/fileUploadService';
import { useLanguage } from '../../../contexts/LanguageContext';

export function useChatInput(roomId, currentUser, username) {
  const [inputMessage, setInputMessage] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  
  const { t } = useLanguage();

  const sendMessage = useCallback(async function() {
    if (inputMessage.trim() && currentUser) {
      // 분당 제한 체크
      const rateLimitMinute = RateLimitedActions.checkMessagePost(currentUser.id);
      if (!rateLimitMinute.allowed) {
        return;
      }

      // 일일 제한 체크
      const rateLimitDaily = RateLimitedActions.checkMessagePostDaily(currentUser.id);
      if (!rateLimitDaily.allowed) {
        return;
      }

      const { error } = await supabase
        .from('messages')
        .insert({
          room_id: roomId,
          content: sanitizeInput(inputMessage.trim()),
          sender_id: currentUser.id,
          sender_name: username,
          type: 'chat',
          is_read: false,
          reply_to: replyTo ? {
            message: sanitizeInput(replyTo.content || replyTo.message),
            username: replyTo.sender_name || replyTo.username
          } : null
        });

      if (!error) {
        setInputMessage('');
        setReplyTo(null);
      } else {
        if (__DEV__) console.error('[ChatInput] 메시지 전송 오류:', error);
        Alert.alert(t('error'), t('messageSendFailed'));
      }
    }
  }, [inputMessage, currentUser, roomId, username, replyTo, t]);

  const handleFileSelected = useCallback(async function(file, fileType) {
    setIsUploading(true);
    try {
      let uploadResult;
      
      if (fileType === 'image') {
        uploadResult = await uploadImageMessage(roomId, file);
      } else if (fileType === 'document') {
        uploadResult = await uploadDocumentMessage(roomId, file);
      }

      if (uploadResult.success && currentUser) {
        const { error } = await supabase
          .from('messages')
          .insert({
            room_id: roomId,
            content: `[${fileType === 'image' ? t('image') : t('document')}] ${file.name}`,
            sender_id: currentUser.id,
            sender_name: username,
            type: 'file',
            attachment: uploadResult.attachment
          });
        
        if (error) {
          if (__DEV__) console.error('[ChatInput] 파일 메시지 저장 오류:', error);
          Alert.alert('오류', '파일 메시지 전송에 실패했습니다.');
        }
      } else if (!uploadResult.success) {
        Alert.alert('오류', uploadResult.error);
      }
    } catch (error) {
      if (__DEV__) console.error('[ChatInput] 파일 업로드 오류:', error);
      Alert.alert('오류', '파일 업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  }, [roomId, currentUser, username, t]);

  const handleReplyToMessage = useCallback(function(message) {
    setReplyTo(message);
  }, []);

  const cancelReply = useCallback(function() {
    setReplyTo(null);
  }, []);

  const handleKeyboardShow = useCallback(function() {
    setKeyboardVisible(true);
  }, []);

  const handleKeyboardHide = useCallback(function() {
    setKeyboardVisible(false);
  }, []);

  return {
    inputMessage,
    setInputMessage,
    replyTo,
    setReplyTo,
    isUploading,
    keyboardVisible,
    sendMessage,
    handleFileSelected,
    handleReplyToMessage,
    cancelReply,
    handleKeyboardShow,
    handleKeyboardHide
  };
}