import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../../../shared';
import { useLanguage } from '../../../contexts/LanguageContext';

export function useSelectFriend() {
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

  const loadCurrentUser = useCallback(async function() {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  }, []);

  const loadFriends = useCallback(async function() {
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
  }, [currentUser]);

  const startChatWithFriend = useCallback(async function(friend, navigation) {
    try {
      // 기존 채팅방 찾기
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
          Alert.alert(t('createChatRoomFailed'));
          return;
        }

        roomId = newRoom.id;
        
        // chat_participants 테이블에 참가자 추가
        const { error: participantsError } = await supabase
          .from('chat_participants')
          .upsert([
            { room_id: roomId, user_id: currentUser.id },
            { room_id: roomId, user_id: friend.user_profiles.id }
          ], { 
            onConflict: 'room_id,user_id',
            ignoreDuplicates: true 
          });

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
      Alert.alert(t('cannotStartChat'));
    }
  }, [currentUser, t]);

  const filteredFriends = friends.filter(function(friend) {
    if (!searchQuery.trim()) return true;
    const friendName = friend.user_profiles.username || friend.user_profiles.email || '';
    return friendName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return {
    friends: filteredFriends,
    loading,
    searchQuery,
    setSearchQuery,
    startChatWithFriend
  };
}