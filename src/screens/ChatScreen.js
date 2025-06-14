import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Button, TextInput, ScrollView, KeyboardAvoidingView, Platform, Alert, Clipboard } from 'react-native';
import { supabase } from '../services/supabaseClient';
import FileUploadButton from '../components/FileUploadButton';
import MessageAttachment from '../components/MessageAttachment';
import MessageReply from '../components/MessageReply';
import MessageItem from '../components/MessageItem';
import { uploadImageMessage, uploadDocumentMessage } from '../services/fileUploadService';
import { sanitizeInput } from '../utils/sanitizer';
import notificationService from '../services/notificationService';
import { AppState } from 'react-native';

export default function ChatScreen({ route, navigation }) {
  const { roomId, roomName } = route.params || { roomId: 'general', roomName: '일반 채팅방' };
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
  const scrollViewRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);
  const currentUserRef = useRef(null);
  const notificationSettingsRef = useRef(null);

  useEffect(() => {
    navigation.setOptions({ title: roomName });
    loadUser();
    
    // 하단 탭 숨기기
    navigation.getParent()?.setOptions({
      tabBarStyle: { display: 'none' }
    });
    
    return () => {
      // 화면 나갈 때 탭 다시 보이기
      navigation.getParent()?.setOptions({
        tabBarStyle: {
          display: 'flex',
          backgroundColor: '#F5F1E8',
          borderTopColor: '#E5E1D8',
          borderTopWidth: 0.5,
          elevation: 0,
          shadowOpacity: 0,
          height: 100,
          paddingBottom: 40,
          paddingTop: 5,
          position: 'absolute',
          bottom: 0,
        }
      });
    };
  }, []);

  useEffect(() => {
    if (!currentUser || !roomId) return;

    loadMessages();
    markMessagesAsRead(); // 채팅방 들어올 때 메시지를 읽음으로 표시
    
    // Supabase v2 패턴: 매번 새 채널 생성하고 제거
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
        async (payload) => {
          const newMessage = payload.new;
          
          // 함수형 업데이트로 stale closure 방지
          setMessages(prev => [...prev, newMessage]);
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }, 100);
          markMessagesAsRead(); // 새 메시지 수신 시에도 읽음으로 표시
          
          // 알림 발송 (백그라운드이고, 다른 사용자의 메시지이고, 알림이 켜져있을 때)
          if (appStateRef.current === 'background' && 
              newMessage.sender_id !== currentUserRef.current?.id &&
              notificationSettingsRef.current?.push_notifications_enabled) {
            await notificationService.sendMessageNotification(
              newMessage.sender_name || '알 수 없는 사용자',
              newMessage.content || '새 메시지',
              roomId
            );
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });
    
    // Cleanup - 매번 채널 제거
    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]); // currentUser는 ref로 참조하여 의존성에서 제거

  // ref 값 업데이트
  useEffect(() => {
    currentUserRef.current = currentUser;
    notificationSettingsRef.current = notificationSettings;
  }, [currentUser, notificationSettings]);

  // 앱 상태 감지 (백그라운드/포그라운드)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      appStateRef.current = nextAppState;
      setAppState(nextAppState);
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  // 알림 설정 불러오기
  useEffect(() => {
    if (currentUser?.id) {
      loadNotificationSettings();
    }
  }, [currentUser]);

  const loadNotificationSettings = async () => {
    if (!currentUser?.id) return;
    const settings = await notificationService.getNotificationSettings(currentUser.id);
    setNotificationSettings(settings);
  };

  const loadUser = async () => {
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

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .limit(50);
    
    if (data) {
      setMessages(data);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: false });
      }, 100);
    }
  };

  const markMessagesAsRead = async () => {
    if (!currentUser || !roomId) return;
    
    // 이 채팅방의 모든 메시지를 읽음으로 표시 (내가 보낸 메시지 제외)
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('room_id', roomId)
      .neq('sender_id', currentUser.id);
  };


  const sendMessage = async () => {
    if (inputMessage.trim() && currentUser) {
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
        Alert.alert('오류', '메시지 전송에 실패했습니다.');
      }
    }
  };

  const handleReply = (message) => {
    setReplyTo(message);
  };

  const handleCopyMessage = (text) => {
    Clipboard.setString(text);
    Alert.alert('복사 완료', '메시지가 클립보드에 복사되었습니다.');
  };

  const handleDeleteMessage = (message) => {
    // 메시지 삭제 로직 (실제 구현에서는 서버/DB에서 삭제)
    setMessages(prev => prev.filter(msg => msg !== message));
    Alert.alert('삭제 완료', '메시지가 삭제되었습니다.');
  };

  const handleFileSelected = async (file, fileType) => {
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
            content: `[${fileType === 'image' ? '이미지' : '문서'}] ${file.name}`,
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
    <View style={styles.container}>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((msg, index) => (
          <MessageItem
            key={index}
            message={msg}
            isOwn={msg.sender_name === username || msg.username === username}
            username={username}
            onReply={handleReply}
            onCopy={handleCopyMessage}
            onDelete={handleDeleteMessage}
          />
        ))}
        {isTyping.length > 0 && (
          <View style={styles.typingIndicator}>
            <Text style={styles.typingText}>
              {isTyping.join(', ')}님이 입력중...
            </Text>
          </View>
        )}
      </ScrollView>

      <MessageReply 
        replyTo={replyTo} 
        onCancel={() => setReplyTo(null)} 
      />

      <View style={styles.inputContainer}>
        <FileUploadButton
          onFileSelected={handleFileSelected}
          disabled={!isConnected || isUploading}
          size={26}
        />
        <TextInput
          style={styles.textInput}
          value={inputMessage}
          onChangeText={setInputMessage}
          placeholder="메시지를 입력하세요..."
          editable={isConnected && !isUploading}
          onSubmitEditing={sendMessage}
          maxLength={1000}
        />
        <Button 
          title={isUploading ? "업로드중..." : "전송"} 
          onPress={sendMessage}
          disabled={!isConnected || !inputMessage.trim() || isUploading}
        />
      </View>
    </View>
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