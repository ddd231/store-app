import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { theme } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabaseClient';
import notificationService from '../services/notificationService';

export default function FriendsListScreen({ navigation }) {
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedTab, setSelectedTab] = useState('friends'); // 'friends' 또는 'requests'

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadFriends();
      loadPendingRequests();
    }
  }, [currentUser]);

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const loadFriends = async () => {
    try {
      const { data, error } = await supabase
        .from('friends')
        .select(`
          id,
          friend_id,
          user_profiles!friend_id (
            id,
            username,
            email
          )
        `)
        .eq('user_id', currentUser.id)
        .eq('status', 'accepted');

      if (!error && data) {
        setFriends(data);
      }
    } catch (error) {
      console.error('친구 목록 로드 오류:', error);
    }
  };

  const loadPendingRequests = async () => {
    try {
      
      // 받은 친구 요청
      const { data, error } = await supabase
        .from('friends')
        .select(`
          id,
          user_id,
          user_profiles!user_id (
            id,
            username,
            email
          )
        `)
        .eq('friend_id', currentUser.id)
        .eq('status', 'pending');


      if (!error && data) {
        setPendingRequests(data);
      }
    } catch (error) {
      console.error('친구 요청 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const acceptFriendRequest = async (requestId, userId) => {
    try {
      // 요청 수락
      const { error: updateError } = await supabase
        .from('friends')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // 양방향 친구 관계 생성
      const { error: insertError } = await supabase
        .from('friends')
        .insert([
          {
            user_id: currentUser.id,
            friend_id: userId,
            status: 'accepted'
          }
        ]);

      if (insertError) throw insertError;

      // 친구 요청 수락 알림 (상대방에게 알림 전송하려면 서버사이드 함수 필요)
      // 여기서는 로컬 알림만 표시
      await notificationService.scheduleLocalNotification(
        '친구 요청 수락됨',
        '친구 요청을 수락했습니다.',
        { type: 'friend_accepted' }
      );

      Alert.alert('성공', '친구 요청을 수락했습니다.');
      loadFriends();
      loadPendingRequests();
    } catch (error) {
      console.error('친구 요청 수락 오류:', error);
      Alert.alert('오류', '친구 요청 수락에 실패했습니다.');
    }
  };

  const rejectFriendRequest = async (requestId) => {
    try {
      const { error } = await supabase
        .from('friends')
        .delete()
        .eq('id', requestId);

      if (error) throw error;

      Alert.alert('성공', '친구 요청을 거절했습니다.');
      loadPendingRequests();
    } catch (error) {
      console.error('친구 요청 거절 오류:', error);
      Alert.alert('오류', '친구 요청 거절에 실패했습니다.');
    }
  };

  const renderFriendItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.friendItem}
      onPress={() => navigation.navigate('UserProfile', { 
        userId: item.user_profiles.id, 
        userName: item.user_profiles.username 
      })}
    >
      <View style={styles.friendInfo}>
        <Ionicons name="person-circle-outline" size={40} color={theme.colors.text.secondary} />
        <Text style={styles.friendName}>
          {item.user_profiles.username || item.user_profiles.email || '사용자'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
    </TouchableOpacity>
  );

  const renderRequestItem = ({ item }) => (
    <View style={styles.requestItem}>
      <View style={styles.friendInfo}>
        <Ionicons name="person-circle-outline" size={40} color={theme.colors.text.secondary} />
        <Text style={styles.friendName}>
          {item.user_profiles.username || item.user_profiles.email || '사용자'}
        </Text>
      </View>
      <View style={styles.requestActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.acceptButton]}
          onPress={() => acceptFriendRequest(item.id, item.user_id)}
        >
          <Text style={styles.acceptText}>수락</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => rejectFriendRequest(item.id)}
        >
          <Text style={styles.rejectText}>거절</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

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
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>친구</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* 탭 */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'friends' && styles.tabActive]}
          onPress={() => setSelectedTab('friends')}
        >
          <Text style={[styles.tabText, selectedTab === 'friends' && styles.tabTextActive]}>
            친구 목록 ({friends.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'requests' && styles.tabActive]}
          onPress={() => setSelectedTab('requests')}
        >
          <Text style={[styles.tabText, selectedTab === 'requests' && styles.tabTextActive]}>
            요청 ({pendingRequests.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* 리스트 */}
      <FlatList
        data={selectedTab === 'friends' ? friends : pendingRequests}
        renderItem={selectedTab === 'friends' ? renderFriendItem : renderRequestItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons 
              name="people-outline" 
              size={60} 
              color={theme.colors.text.secondary} 
            />
            <Text style={styles.emptyText}>
              {selectedTab === 'friends' ? '아직 친구가 없습니다' : '받은 요청이 없습니다'}
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
    color: theme.colors.text.primary,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  listContainer: {
    paddingVertical: theme.spacing.md,
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
  requestItem: {
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
  },
  friendName: {
    ...theme.typography.body,
    marginLeft: theme.spacing.md,
    fontWeight: '500',
  },
  requestActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.small,
  },
  acceptButton: {
    backgroundColor: theme.colors.primary,
  },
  rejectButton: {
    backgroundColor: theme.colors.error,
  },
  acceptText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  rejectText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
});