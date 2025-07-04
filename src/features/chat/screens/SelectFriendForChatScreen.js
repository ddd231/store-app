import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { theme } from '../../../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../shared';
import { useLanguage } from '../../../contexts/LanguageContext';

export default function SelectFriendForChatScreen({ navigation }) {
  const { t } = useLanguage();
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(function() {
    loadCurrentUser();
  }, []);

  useEffect(function() {
    if (currentUser) {
      loadFriends();
    }
  }, [currentUser]);

  async function loadCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  async function loadFriends() {
    try {
      const { data, error } = await supabase
        .from('friends')
        .select(`
          id,
          friend_id,
          user_profiles!friends_friend_id_fkey (
            id,
            username,
            email,
            short_intro
          )
        `)
        .eq('user_id', currentUser.id)
        .eq('status', 'accepted');

      if (!error && data) {
        setFriends(data);
      }
    } catch (error) {
      console.error('친구 목록 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  async function startChatWithFriend(friend) {
    try {
      // 기존 채팅방이 있는지 확인
      // 기존 채팅방 찾기 - 두 사용자 간의 개인 채팅방 확인
      const { data: existingRoom, error: searchError } = await supabase
        .from('chat_rooms')
        .select('id, name')
        .or(`and(creator_id.eq.${currentUser.id},participant_id.eq.${friend.user_profiles.id}),and(creator_id.eq.${friend.user_profiles.id},participant_id.eq.${currentUser.id})`)
        .limit(1);

      if (searchError) {
        console.error('채팅방 검색 오류:', searchError);
      }

      let roomId, roomName;

      if (existingRoom && existingRoom.length > 0) {
        // 기존 채팅방이 있으면 그 방으로 이동
        roomId = existingRoom[0].id;
        roomName = existingRoom[0].name;
      } else {
        // 새 채팅방 생성
        const { data: newRoom, error: createError } = await supabase
          .from('chat_rooms')
          .insert([
            {
              name: `${currentUser.email?.split('@')[0] || 'User'}, ${friend.user_profiles.username || friend.user_profiles.email?.split('@')[0] || 'Friend'}`,
              creator_id: currentUser.id,
              participant_id: friend.user_profiles.id,
              is_private: true
            }
          ])
          .select()
          .single();

        if (createError) {
          console.error('채팅방 생성 오류:', createError);
          alert(t('createChatRoomFailed'));
          return;
        }

        roomId = newRoom.id;
        
        // chat_participants 테이블에 참가자 추가
        const { error: participantsError } = await supabase
          .from('chat_participants')
          .insert([
            { room_id: roomId, user_id: currentUser.id },
            { room_id: roomId, user_id: friend.user_profiles.id }
          ]);

        if (participantsError) {
          console.error('참가자 추가 오류:', participantsError);
        }
        roomName = newRoom.name;
      }

      // 채팅 화면으로 이동
      navigation.navigate('Chat', {
        roomId: roomId,
        roomName: roomName
      });

    } catch (error) {
      console.error('채팅 시작 오류:', error);
      alert(t('cannotStartChat'));
    }
  };

  const filteredFriends = friends.filter(function(friend) {
    if (!searchQuery.trim()) return true;
    const friendName = friend.user_profiles.username || friend.user_profiles.email || '';
    return friendName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  function renderFriendItem({ item }) {
    return (
      <TouchableOpacity 
      style={styles.friendItem}
      onPress={function() { startChatWithFriend(item); }}
    >
      <View style={styles.friendInfo}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={24} color={theme.colors.text.secondary} />
        </View>
        <View style={styles.friendDetails}>
          <Text style={styles.friendName}>
            {item.user_profiles.username || item.user_profiles.email?.split('@')[0] || t('user')}
          </Text>
          <Text style={styles.friendSubtext}>
            {item.user_profiles.short_intro || t('startChatting')}
          </Text>
        </View>
      </View>
      <Ionicons name="chatbubble-outline" size={20} color={theme.colors.primary} />
    </TouchableOpacity>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={function() { navigation.goBack(); }}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('newChat')}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* 검색창 */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={theme.colors.text.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('searchFriend')}
            placeholderTextColor={theme.colors.text.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* 친구 목록 */}
      <FlatList
        data={filteredFriends}
        renderItem={renderFriendItem}
        keyExtractor={function(item) { return item.id; }}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons 
              name="people-outline" 
              size={60} 
              color={theme.colors.text.secondary} 
            />
            <Text style={styles.emptyText}>
              {searchQuery ? t('noSearchResults') : t('noFriendsToChat')}
            </Text>
            <Text style={styles.emptySubtext}>
              {t('addFriendsFirst')}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 60,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  searchContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E8E0D0',
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
    paddingBottom: theme.spacing.xl,
  },
  friendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.colors.border,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    ...theme.typography.body,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  friendSubtext: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
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
