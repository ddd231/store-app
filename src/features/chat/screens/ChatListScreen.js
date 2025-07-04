import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert, Modal } from 'react-native';
import { theme } from '../../../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../shared';
import { useAuth } from '../../auth/hooks/useAuth';
import AnimatedButton from '../../../components/AnimatedButton';
import { useLanguage } from '../../../contexts/LanguageContext';

export default function ChatListScreen({ navigation }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastMessages, setLastMessages] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');

  useEffect(function() {
    if (user) {
      loadChatRooms();
    } else {
      setLoading(false);
      setChats([]);
    }
  }, [user]);

  useEffect(function() {
    // 화면에 포커스될 때마다 채팅방 목록 새로고침
    const unsubscribe = navigation.addListener('focus', function() {
      if (user) {
        loadChatRooms();
      }
    });

    return unsubscribe;
  }, [navigation, user]);

  async function loadChatRooms() {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    console.log('[ChatListScreen] 채팅방 로딩 시작, user ID:', user.id);
    
    try {
      // 1단계: 사용자가 참여한 채팅방 ID들 가져오기
      const participantsPromise = supabase
        .from('chat_participants')
        .select('room_id')
        .eq('user_id', user.id);

      const timeoutPromise = new Promise(function(_, reject) {
        setTimeout(function() {
          reject(new Error('채팅방 로드 타임아웃'));
        }, 15000);
      });

      const { data: participantData, error: participantError } = await Promise.race([participantsPromise, timeoutPromise]);

      console.log('[ChatListScreen] 참여자 쿼리 결과:', { participantData, participantError });

      if (participantError) {
        console.error('참여자 데이터 로드 오류:', participantError);
        setChats([]);
        return;
      }

      if (!participantData || participantData.length === 0) {
        console.log('[ChatListScreen] 참여 중인 채팅방이 없음');
        setChats([]);
        return;
      }

      // 2단계: 참여한 채팅방들의 정보 가져오기
      const roomIds = participantData.map(function(p) { return p.room_id; });
      
      const roomsPromise = supabase
        .from('chat_rooms')
        .select('*')
        .in('id', roomIds)
        .order('created_at', { ascending: false });

      const { data, error } = await Promise.race([roomsPromise, timeoutPromise]);

      console.log('[ChatListScreen] 채팅방 쿼리 결과:', { data, error });

      if (error) {
        console.error('채팅방 로드 오류:', error);
        setChats([]);
      } else if (data) {
        console.log('[ChatListScreen] 채팅방 데이터 로드 성공:', data.length, '개');
        setChats(data);
        
        // 각 채팅방의 마지막 메시지와 안읽은 메시지 수 가져오기
        try {
          await loadChatMetadata(data);
        } catch (metaError) {
          console.error('메타데이터 로드 실패, 기본 채팅방 목록만 표시:', metaError);
          // Continue with just the basic chat list if metadata fails
        }
      } else {
        console.log('[ChatListScreen] 데이터가 비어있음');
        setChats([]);
      }
    } catch (error) {
      console.error('채팅방 로드 오류:', error);
      setChats([]);
    } finally {
      console.log('[ChatListScreen] 로딩 완료');
      setLoading(false);
    }
  };

  async function loadChatMetadata(chatRooms) {
    try {
      const messages = {};
      const counts = {};
      
      // Add timeout for the entire metadata loading process
      const metadataPromise = Promise.all(chatRooms.map(async function(room) {
        try {
          // 마지막 메시지 가져오기
          const { data: lastMsg, error: msgError } = await supabase
            .from('messages')
            .select('*')
            .eq('room_id', room.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
          
          if (!msgError && lastMsg) {
            messages[room.id] = lastMsg;
          }
          
          // 안읽은 메시지 수 가져오기 (is_read가 false인 것만)
          const { count, error: countError } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', room.id)
            .neq('sender_id', user.id)
            .eq('is_read', false);
          
          if (!countError && count > 0) {
            counts[room.id] = count;
          }
        } catch (roomError) {
          console.error(`채팅방 ${room.id} 메타데이터 로드 오류:`, roomError);
          // Continue processing other rooms even if one fails
        }
      }));
      
      // Set 10 second timeout for metadata loading
      const timeoutPromise = new Promise(function(_, reject) {
        setTimeout(function() {
          reject(new Error('메타데이터 로드 타임아웃'));
        }, 10000);
      });
      
      await Promise.race([metadataPromise, timeoutPromise]);
      
      setLastMessages(messages);
      setUnreadCounts(counts);
    } catch (error) {
      console.error('채팅 메타데이터 로드 오류:', error);
      // Ensure metadata is set even on error
      setLastMessages({});
      setUnreadCounts({});
    }
  };

  const filteredChats = chats.filter(function(chat) {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const chatName = chat.name.toLowerCase();
    const lastMessageContent = lastMessages[chat.id]?.content?.toLowerCase() || '';
    
    return chatName.includes(query) || lastMessageContent.includes(query);
  }).sort(function(a, b) {
    const aDate = lastMessages[a.id]?.created_at || a.created_at;
    const bDate = lastMessages[b.id]?.created_at || b.created_at;
    return new Date(bDate) - new Date(aDate);
  });

  // 채팅방 이름 변경 함수 (로컬 표시용)
  function handleRenameRoom(roomId, currentName) {
    setSelectedRoom({ id: roomId, name: currentName });
    setNewRoomName(currentName || '');
    setRenameModalVisible(true);
  };

  // 이름 변경 확인
  function confirmRename() {
    if (newRoomName.trim() && selectedRoom) {
      const updatedRooms = chats.map(function(room) { return (
        room.id === selectedRoom.id 
          ? { ...room, displayName: newRoomName.trim() }
          : room
      ); });
      setChats(updatedRooms);
      setRenameModalVisible(false);
      setNewRoomName('');
    }
  };

  // 채팅방 나가기 함수
  async function handleLeaveRoom(roomId, roomName) {
    Alert.alert(
      '채팅방 나가기',
      `"${roomName}" 채팅방을 나가시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '나가기',
          style: 'destructive',
          onPress: async function() {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                const { error } = await supabase
                  .from('chat_participants')
                  .delete()
                  .eq('room_id', roomId)
                  .eq('user_id', user.id);

                if (error) {
                  Alert.alert('오류', '채팅방 나가기에 실패했습니다.');
                } else {
                  loadChatRooms(); // 목록 새로고침
                }
              }
            } catch (error) {
              Alert.alert('오류', '채팅방 나가기 중 문제가 발생했습니다.');
            }
          }
        }
      ]
    );
  };

  // 롱프레스 핸들러
  function handleLongPress(item) {
    setSelectedRoom(item);
    setModalVisible(true);
  };

  function renderChatItem({ item }) {
    const lastMessage = lastMessages[item.id];
    const unreadCount = unreadCounts[item.id];
    
    return (
      <AnimatedButton 
        style={styles.chatItem}
        onPress={function() { navigation.navigate('Chat', { roomId: item.id, roomName: item.name }); }}
        onLongPress={function() { handleLongPress(item); }}
        animationType="none"
      >
        <View style={styles.chatContent}>
          <Text style={styles.chatName}>{item.displayName || item.name}</Text>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {lastMessage ? lastMessage.content : t('newChatRoomCreated')}
          </Text>
        </View>
        <View style={styles.chatMeta}>
          <Text style={styles.timeText}>
            {lastMessage 
              ? new Date(lastMessage.created_at).toLocaleDateString('ko-KR')
              : new Date(item.created_at).toLocaleDateString('ko-KR')
            }
          </Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{unreadCount}</Text>
            </View>
          )}
        </View>
      </AnimatedButton>
    );
  };

  return (
    <View style={styles.container}>
      {/* 헤더 영역 */}
      <View style={styles.headerContainer}>
        <View style={styles.titleRow}>
          <Text style={styles.headerTitle}>{t('chat')}</Text>
          <TouchableOpacity 
            style={styles.searchButton}
            onPress={function() { setShowSearchBar(!showSearchBar); }}
          >
            <Ionicons name="search" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
        </View>
        
        {showSearchBar && (
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color={theme.colors.text.secondary} />
              <TextInput
                style={styles.searchInput}
                placeholder={t('searchChat')}
                placeholderTextColor={theme.colors.text.placeholder}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus={true}
              />
              <TouchableOpacity 
                onPress={function() {
                  setShowSearchBar(false);
                  setSearchQuery('');
                }}
              >
                <Ionicons name="close" size={20} color={theme.colors.text.secondary} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* 채팅 리스트 */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : filteredChats.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={60} color={theme.colors.text.secondary} />
          <Text style={styles.emptyText}>{t('noChatRooms')}</Text>
          <Text style={styles.emptySubtext}>{t('addFriendsToChat')}</Text>
        </View>
      ) : (
        <FlatList
          style={styles.listContainer}
          data={filteredChats}
          renderItem={renderChatItem}
          keyExtractor={function(item) { return item.id?.toString() || ''; }}
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          maxToRenderPerBatch={5}
          windowSize={10}
        />
      )}

      {/* 새 채팅 버튼 */}
      <AnimatedButton 
        style={styles.floatingButton}
        onPress={function() { navigation.navigate('SelectFriendForChat'); }}
        animationType="scale"
      >
        <Ionicons name="add" size={20} color="white" />
      </AnimatedButton>

      {/* 모달 */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={function() { setModalVisible(false); }}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={function() { setModalVisible(false); }}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={function() {
                setModalVisible(false);
                if (selectedRoom) {
                  handleRenameRoom(selectedRoom.id, selectedRoom.displayName || selectedRoom.name);
                }
              }}
            >
              <Text style={styles.modalButtonText}>{t('renameChatRoom')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalButton, styles.destructiveButton]}
              onPress={function() {
                setModalVisible(false);
                if (selectedRoom) {
                  handleLeaveRoom(selectedRoom.id, selectedRoom.displayName || selectedRoom.name);
                }
              }}
            >
              <Text style={[styles.modalButtonText, styles.destructiveText]}>{t('leaveChatRoom')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]}
              onPress={function() { setModalVisible(false); }}
            >
              <Text style={styles.modalButtonText}>{t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 이름 변경 모달 */}
      <Modal
        visible={renameModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={function() { setRenameModalVisible(false); }}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={function() { setRenameModalVisible(false); }}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('renameChatRoom')}</Text>
            <TextInput
              style={styles.renameInput}
              value={newRoomName}
              onChangeText={setNewRoomName}
              placeholder={t('newChatRoomName')}
              autoFocus={true}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={function() {
                  setRenameModalVisible(false);
                  setNewRoomName('');
                }}
              >
                <Text style={styles.modalButtonText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={confirmRename}
              >
                <Text style={styles.modalButtonText}>{t('confirm')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 60,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  searchButton: {
    padding: theme.spacing.xs,
  },
  searchContainer: {
    marginTop: theme.spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 12,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    ...theme.typography.body,
    color: theme.colors.text.primary,
  },
  listContainer: {
    flex: 1,
    paddingBottom: 100,
  },
  listContent: {
    paddingBottom: 100,
  },
  chatItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  chatContent: {
    flex: 1,
    marginRight: theme.spacing.md,
    paddingTop: 2,
  },
  chatName: {
    ...theme.typography.body,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    marginTop: 1,
    color: '#000000',
  },
  lastMessage: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    marginTop: 1,
  },
  chatMeta: {
    alignItems: 'flex-end',
  },
  timeText: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  unreadBadge: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  unreadText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  separator: {
    height: 0.5,
    backgroundColor: theme.colors.border,
    marginLeft: theme.spacing.lg,
  },
  floatingButton: {
    position: 'absolute',
    bottom: theme.spacing.lg + 130, // 더 위로 올림
    right: theme.spacing.lg,
    width: 50, // 크기 축소
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.large,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -200,
    paddingHorizontal: theme.spacing.lg,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.md,
    textAlign: 'center',
    fontWeight: '600',
  },
  emptySubtext: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 300,
  },
  modalButton: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  destructiveButton: {
    backgroundColor: 'transparent',
  },
  destructiveText: {
    color: '#333',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    marginBottom: 0,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  renameInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

// Component doesn't have export default at the end, it's defined at function declaration