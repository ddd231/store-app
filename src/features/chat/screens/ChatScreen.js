import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Alert, Clipboard, Keyboard } from 'react-native';
import { ErrorBoundary } from '../../../shared';
import { theme } from '../../../styles/theme';
import MessagesList from '../components/MessagesList';
import ChatInputBar from '../components/ChatInputBar';
import { useChatAuth } from '../hooks/useChatAuth';
import { useChatMessages } from '../hooks/useChatMessages';
import { useChatRealtime } from '../hooks/useChatRealtime';
import { useChatInput } from '../hooks/useChatInput';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ChatScreen({ route, navigation }) {
  const { t } = useLanguage();
  const { roomId, roomName } = route.params || { roomId: 'general', roomName: t('generalChatRoom') };
  const insets = useSafeAreaInsets();
  const [isTyping, setIsTyping] = useState([]);

  // Custom Hooks
  const { currentUser, username, currentUserRef } = useChatAuth();
  const { messages, setMessages, markMessagesAsRead, flatListRef, scrollToEnd } = useChatMessages(roomId, currentUser);
  const { isConnected } = useChatRealtime(roomId, currentUserRef, setMessages, markMessagesAsRead);
  const {
    inputMessage,
    setInputMessage,
    replyTo,
    isUploading,
    keyboardVisible,
    sendMessage,
    handleFileSelected,
    handleReplyToMessage,
    cancelReply,
    handleKeyboardShow,
    handleKeyboardHide
  } = useChatInput(roomId, currentUser, username);

  // 메시지 핸들러 함수들
  const handleCopyMessage = useCallback(function(text) {
    Clipboard.setString(text);
    Alert.alert(t('success'), t('messageCopied'));
  }, [t]);

  const handleDeleteMessage = useCallback(function(message) {
    setMessages(function(prev) { return prev.filter(function(msg) { return msg !== message; }); });
    Alert.alert(t('success'), t('messageDeleted'));
  }, [setMessages, t]);

  // 네비게이션 설정
  useEffect(function() {
    navigation.setOptions({ title: roomName });
    
    // 하단 탭 숨기기
    navigation.getParent()?.setOptions({
      tabBarStyle: { display: 'none' }
    });
    
    return function() {
      // 화면 나갈 때 탭 다시 보이기
      navigation.getParent()?.setOptions({
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
          borderTopWidth: 0.5,
          elevation: 0,
          shadowOpacity: 0,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 4,
          position: 'absolute',
          bottom: 0,
        }
      });
    };
  }, [navigation, roomName, insets.bottom]);

  // 키보드 이벤트 리스너
  useEffect(function() {
    const showListener = Keyboard.addListener('keyboardDidShow', handleKeyboardShow);
    const hideListener = Keyboard.addListener('keyboardDidHide', handleKeyboardHide);

    return function() {
      showListener?.remove();
      hideListener?.remove();
    };
  }, [handleKeyboardShow, handleKeyboardHide]);

  // 스크롤 효과
  useEffect(function() {
    if (keyboardVisible) {
      scrollToEnd();
    }
  }, [keyboardVisible, scrollToEnd]);

  return (
    <ErrorBoundary name="ChatScreen">
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <MessagesList
          messages={messages}
          flatListRef={flatListRef}
          currentUser={currentUser}
          username={username}
          onReply={handleReplyToMessage}
          onCopy={handleCopyMessage}
          onDelete={handleDeleteMessage}
          isTyping={isTyping}
        />

        <ChatInputBar
          inputMessage={inputMessage}
          setInputMessage={setInputMessage}
          sendMessage={sendMessage}
          isUploading={isUploading}
          replyTo={replyTo}
          cancelReply={cancelReply}
          keyboardVisible={keyboardVisible}
        />
      </KeyboardAvoidingView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});