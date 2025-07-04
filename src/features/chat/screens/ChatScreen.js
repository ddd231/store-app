import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Button, TextInput, ScrollView, FlatList, KeyboardAvoidingView, Platform, Alert, Clipboard, Keyboard } from 'react-native';
import { supabase, FileUploadButton, sanitizeInput, RateLimitedActions, useIsMounted, logger, ErrorBoundary } from '../../../shared';
import MessageAttachment from '../components/MessageAttachment';
import MessageReply from '../components/MessageReply';
import MessageItem from '../components/MessageItem';
import { uploadImageMessage, uploadDocumentMessage } from '../../../services/fileUploadService';
import notificationService from '../../../services/notificationService';
import { AppState } from 'react-native';
import { theme } from '../../../styles/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../../../contexts/LanguageContext';

// AdMob 모듈을 조건부로 import
let BannerAd, BannerAdSize, TestIds;
try {
  const AdMob = require('react-native-google-mobile-ads');
  BannerAd = AdMob.BannerAd;
  BannerAdSize = AdMob.BannerAdSize;
  TestIds = AdMob.TestIds;
} catch (error) {
  logger.error('AdMob not available in Expo Go');
}

// AdMob 광고 단위 ID
const adUnitId = Platform.select({
  ios: 'ca-app-pub-3406933300576517/2235875933',
  android: 'ca-app-pub-3406933300576517/2235875933',
});

export default function ChatScreen({ route, navigation }) {
  const { t } = useLanguage();
  const { roomId, roomName } = route.params || { roomId: 'general', roomName: t('generalChatRoom') };
  const insets = useSafeAreaInsets();
  const isMounted = useIsMounted();
  
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [username, setUsername] = useState('User' + Math.floor(Math.random() * 1000));
  const [isTyping, setIsTyping] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [appState, setAppState] = useState(AppState.currentState);
  const [notificationSettings, setNotificationSettings] = useState(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  
  const flatListRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);
  const currentUserRef = useRef(null);
  const notificationSettingsRef = useRef(null);
  const channelRef = useRef(null);
  const keyboardListenersRef = useRef({ show: null, hide: null });

  // 메시지 핸들러 함수들 먼저 정의
  const handleReply = useCallback(function(message) {
    setReplyTo(message);
  }, []);

  const handleCopyMessage = useCallback(function(text) {
    Clipboard.setString(text);
    Alert.alert(t('success'), t('messageCopied'));
  }, [t]);

  const handleDeleteMessage = useCallback(function(message) {
    // 메시지 삭제 로직 (실제 구현에서는 서버/DB에서 삭제)
    setMessages(function(prev) { return prev.filter(function(msg) { return msg !== message; }); });
    Alert.alert(t('success'), t('messageDeleted'));
  }, [t]);

  // FlatList 최적화를 위한 렌더링 함수들
  const renderMessage = useCallback(function({ item, index }) {
    return (
      <MessageItem
        key={item.id || index}
        message={item}
        isOwn={item.sender_name === username || item.username === username}
        username={username}
        onReply={handleReply}
        onCopy={handleCopyMessage}
        onDelete={handleDeleteMessage}
      />
    );
  }, [username, handleReply, handleCopyMessage, handleDeleteMessage]);

  const getItemLayout = useCallback(function(data, index) {
    return {
      length: 80, // 예상 메시지 높이
      offset: 80 * index,
      index,
    };
  }, []);

  const keyExtractor = useCallback(function(item, index) { return item.id?.toString() || index.toString(); }, []);

  useEffect(function() {
    navigation.setOptions({ title: roomName });
    loadUser();
    
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
  }, []);

  useEffect(function() {
    if (!roomId) return;

    // currentUser가 없어도 메시지는 로드
    loadMessages();
    
    // currentUser가 있을 때만 읽음 표시
    if (currentUser) {
      markMessagesAsRead(); // 채팅방 들어올 때 메시지를 읽음으로 표시
    }
    
    // 이전 채널이 있다면 정리
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    
    // Supabase v2 패턴: 새 채널 생성하고 ref에 저장
    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`
        },
        async function(payload) {
          if (!isMounted()) return; // 컴포넌트가 언마운트되었으면 처리하지 않음
          
          const newMessage = payload.new;
          
          // 함수형 업데이트로 stale closure 방지
          setMessages(function(prev) { return [...prev, newMessage]; });
          
          // 스크롤을 위한 timeout도 안전하게 처리
          const scrollTimeout = setTimeout(function() {
            if (isMounted() && flatListRef.current) {
              flatListRef.current.scrollToEnd({ animated: true });
            }
          }, 100);
          
          // 컴포넌트가 언마운트되면 timeout 정리
          if (!isMounted()) {
            clearTimeout(scrollTimeout);
            return;
          }
          
          markMessagesAsRead(); // 새 메시지 수신 시에도 읽음으로 표시
          
          // 알림 발송 (백그라운드이고, 다른 사용자의 메시지이고, 알림이 켜져있을 때)
          if (appStateRef.current === 'background' && 
              newMessage.sender_id !== currentUserRef.current?.id &&
              notificationSettingsRef.current?.push_notifications_enabled) {
            try {
              await notificationService.sendMessageNotification(
                newMessage.sender_name || t('unknownUser'),
                newMessage.content || t('newMessage'),
                roomId
              );
            } catch (error) {
              logger.error('알림 전송 실패:', error);
            }
          }
        }
      )
      .subscribe(function(status) {
        if (isMounted()) {
          setIsConnected(status === 'SUBSCRIBED');
        }
      });
    
    channelRef.current = channel;
    
    // Cleanup - 채널 제거 및 ref 정리
    return function() {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [roomId, isMounted]); // currentUser는 ref로 참조하여 의존성에서 제거

  // ref 값 업데이트
  useEffect(function() {
    currentUserRef.current = currentUser;
    notificationSettingsRef.current = notificationSettings;
  }, [currentUser, notificationSettings]);

  // 앱 상태 감지 (백그라운드/포그라운드)
  useEffect(function() {
    const subscription = AppState.addEventListener('change', function(nextAppState) {
      appStateRef.current = nextAppState;
      setAppState(nextAppState);
    });

    return function() {
      subscription?.remove();
    };
  }, []);

  // 알림 설정 불러오기
  useEffect(function() {
    if (currentUser?.id) {
      loadNotificationSettings();
    }
  }, [currentUser]);

  // 키보드 이벤트 감지 (메모리 누수 방지)
  useEffect(function() {
    function handleKeyboardShow() {
      if (!isMounted()) return;
      setKeyboardVisible(true);
      setTimeout(function() {
        if (isMounted() && flatListRef.current) {
          flatListRef.current.scrollToEnd({ animated: true });
        }
      }, 100);
    };

    function handleKeyboardHide() {
      if (!isMounted()) return;
      setKeyboardVisible(false);
    };

    keyboardListenersRef.current.show = Keyboard.addListener('keyboardDidShow', handleKeyboardShow);
    keyboardListenersRef.current.hide = Keyboard.addListener('keyboardDidHide', handleKeyboardHide);

    return function() {
      keyboardListenersRef.current.show?.remove();
      keyboardListenersRef.current.hide?.remove();
      keyboardListenersRef.current.show = null;
      keyboardListenersRef.current.hide = null;
    };
  }, [isMounted]);

  async function loadNotificationSettings() {
    if (!currentUser?.id) return;
    const settings = await notificationService.getNotificationSettings(currentUser.id);
    setNotificationSettings(settings);
  };

  async function loadUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUser(user);
      const profile = await supabase
        .from('user_profiles')
        .select('username')
        .eq('id', user.id)
        .single();
      if (profile.data?.username) {
        setUsername(profile.data.username);
      }
    }
  };

  async function loadMessages() {
    try {
      // Add timeout for message loading
      const messagesPromise = supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(50);
      
      const timeoutPromise = new Promise(function(_, reject) {
        setTimeout(function() {
          reject(new Error('메시지 로드 타임아웃'));
        }, 10000);
      });

      const { data, error } = await Promise.race([messagesPromise, timeoutPromise]);
      
      if (error) {
        logger.error('메시지 로드 오류:', error);
        // Set empty messages on error instead of returning
        if (isMounted()) {
          setMessages([]);
        }
        return;
      }
      
      if (isMounted()) {
        setMessages(data || []);
        setTimeout(function() {
          if (isMounted() && flatListRef.current) {
            flatListRef.current.scrollToEnd({ animated: false });
          }
        }, 100);
      }
    } catch (error) {
      logger.error('메시지 로드 예외:', error);
      // Ensure messages state is set even on error
      if (isMounted()) {
        setMessages([]);
      }
    }
  };

  async function markMessagesAsRead() {
    if (!currentUser || !roomId) return;
    
    // 이 채팅방의 모든 메시지를 읽음으로 표시 (내가 보낸 메시지 제외)
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('room_id', roomId)
      .neq('sender_id', currentUser.id);
  };


  async function sendMessage() {
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
        if (__DEV__) console.error('[ChatScreen] 메시지 전송 오류:', error);
        Alert.alert(t('error'), t('messageSendFailed'));
      }
    }
  };

  async function handleFileSelected(file, fileType) {
    setIsUploading(true);
    try {
      let uploadResult;
      
      if (fileType === 'image') {
        uploadResult = await uploadImageMessage(roomId, file);
      } else if (fileType === 'document') {
        uploadResult = await uploadDocumentMessage(roomId, file);
      }

      if (uploadResult.success && currentUser) {
        // 첨부파일이 포함된 메시지를 Supabase에 저장
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
          if (__DEV__) console.error('[ChatScreen] 파일 메시지 저장 오류:', error);
          Alert.alert('오류', '파일 메시지 전송에 실패했습니다.');
        }
      } else if (!uploadResult.success) {
        Alert.alert('오류', uploadResult.error);
      }
    } catch (error) {
      if (__DEV__) console.error('[ChatScreen] 파일 업로드 오류:', error);
      Alert.alert('오류', '파일 업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <ErrorBoundary name="ChatScreen">
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <FlatList 
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={keyExtractor}
        style={styles.messagesContainer}
        contentContainerStyle={{ paddingBottom: 20 }}
        onContentSizeChange={function() { flatListRef.current?.scrollToEnd({ animated: true }); }}
        onLayout={function() { flatListRef.current?.scrollToEnd({ animated: false }); }}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        windowSize={21}
        getItemLayout={getItemLayout}
        initialNumToRender={20}
        ListFooterComponent={
          isTyping.length > 0 ? (
            <View style={styles.typingIndicator}>
              <Text style={styles.typingText}>
                {isTyping.join(', ')}님이 입력중...
              </Text>
            </View>
          ) : null
        }
      />

      <MessageReply 
        replyTo={replyTo} 
        onCancel={function() { setReplyTo(null); }} 
      />

      <View style={[styles.inputContainer, keyboardVisible && { marginBottom: 100 }]}>
        {/* 파일 업로드 버튼 임시 비활성화 - 나중에 다시 활성화 예정
        <FileUploadButton
          onFileSelected={handleFileSelected}
          disabled={!isConnected || isUploading}
          size={26}
        />
        */}
        <TextInput
          style={styles.textInput}
          value={inputMessage}
          onChangeText={setInputMessage}
          placeholder="메시지를 입력하세요..."
          editable={!isUploading}
          onSubmitEditing={sendMessage}
          maxLength={1000}
        />
        <Button 
          title={isUploading ? "업로드중..." : "전송"} 
          onPress={sendMessage}
          disabled={!inputMessage.trim() || isUploading}
        />
      </View>
      </KeyboardAvoidingView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  messagesContainer: {
    flex: 1,
    padding: 10,
  },
  messageItem: {
    marginBottom: 10,
    padding: 10,
    borderRadius: 10,
    maxWidth: '80%',
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f0f0',
  },
  messageSender: {
    fontWeight: 'bold',
    fontSize: 12,
    marginBottom: 5,
  },
  messageContent: {
    fontSize: 16,
  },
  timestamp: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  typingIndicator: {
    padding: 10,
    marginLeft: 10,
  },
  typingText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
    minHeight: 60,
    marginBottom: 50,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginHorizontal: 10,
    fontSize: 16,
    backgroundColor: '#fff',
    maxHeight: 100,
  },
});
