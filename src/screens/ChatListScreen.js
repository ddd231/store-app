import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { theme } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabaseClient';
import AnimatedButton from '../components/AnimatedButton';

export default function ChatListScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [lastMessages, setLastMessages] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadChatRooms();
    }
  }, [currentUser]);

  useEffect(() => {
    // 화면에 포커스될 때마다 채팅방 목록 새로고침
    const unsubscribe = navigation.addListener('focus', () => {
      if (currentUser) {
        loadChatRooms();
      }
    });

    return unsubscribe;
  }, [navigation, currentUser]);

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const loadChatRooms = async () => {
    try {
      // 내가 참여한 채팅방들 조회
      const { data, error } = await supabase
        .from('chat_rooms')
        .select(`
          id,
          name,
          created_at,
          creator_id,
          participant_id
        `)
        .or(`creator_id.eq.${currentUser.id},participant_id.eq.${currentUser.id}`)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setChats(data);
        
        // 각 채팅방의 마지막 메시지와 안읽은 메시지 수 가져오기
        await loadChatMetadata(data);
      }
    } catch (error) {
      console.error('채팅방 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadChatMetadata = async (chatRooms) => {
    try {
      const messages = {};
      const counts = {};
      
      for (const room of chatRooms) {
        // 마지막 메시지 가져오기
        const { data: lastMsg } = await supabase
          .from('messages')
          .select('*')
          .eq('room_id', room.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (lastMsg) {
          messages[room.id] = lastMsg;
        }
        
        // 안읽은 메시지 수 가져오기 (is_read가 false인 것만)
        const { count, error: countError } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('room_id', room.id)
          .neq('sender_id', currentUser.id)
          .eq('is_read', false);
        
        
        if (count > 0) {
          counts[room.id] = count;
        }
      }
      
      setLastMessages(messages);
      setUnreadCounts(counts);
    } catch (error) {
      console.error('채팅 메타데이터 로드 오류:', error);
    }
  };

  const filteredChats = chats.filter(chat => {
    if (!searchQuery.trim()) return true;
    return chat.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const renderChatItem = ({ item }) => {
    const lastMessage = lastMessages[item.id];
    const unreadCount = unreadCounts[item.id];
    
    return (
      <AnimatedButton 
        style={styles.chatItem}
        onPress={() => navigation.navigate('Chat', { roomId: item.id, roomName: item.name })}
        animationType="none"
      >
        <View style={styles.chatContent}>
          <Text style={styles.chatName}>{item.name}</Text>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {lastMessage ? lastMessage.content : '새 채팅방이 생성되었습니다'}
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
      {/* 검색 바 */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={theme.colors.text.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="채팅방 검색..."
            placeholderTextColor={theme.colors.text.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* 채팅 리스트 */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredChats}
          renderItem={renderChatItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={60} color={theme.colors.text.secondary} />
              <Text style={styles.emptyText}>아직 채팅방이 없습니다</Text>
              <Text style={styles.emptySubtext}>친구를 추가하고 채팅을 시작해보세요</Text>
            </View>
          }
        />
      )}

      {/* 새 채팅 버튼 */}
      <AnimatedButton 
        style={styles.floatingButton}
        onPress={() => navigation.navigate('SelectFriendForChat')}
        animationType="scale"
      >
        <Ionicons name="add" size={20} color="white" />
      </AnimatedButton>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  searchContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 0,
    backgroundColor: 'transparent',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: theme.borderRadius.medium,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    ...theme.typography.body,
    color: theme.colors.text.primary,
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
  },
  chatName: {
    ...theme.typography.body,
    fontWeight: '600',
    marginBottom: 4,
  },
  lastMessage: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
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
    bottom: theme.spacing.lg + 100, // 더 위로 올림
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
    paddingTop: 100,
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
});