import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { theme } from '../../../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../shared';
import { notificationService } from '../../../shared';
import { useLanguage } from '../../../contexts/LanguageContext';

export default function FriendsListScreen({ navigation }) {
  const { t } = useLanguage();
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedTab, setSelectedTab] = useState('friends'); // 'friends' 또는 'requests'

  useEffect(function() {
    loadCurrentUser();
  }, []);

  useEffect(function() {
    if (currentUser) {
      loadFriends();
      loadPendingRequests();
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
    }
  };

  async function loadPendingRequests() {
    try {
      
      // 받은 친구 요청
      const { data, error } = await supabase
        .from('friends')
        .select(`
          id,
          user_id,
          user_profiles!friends_user_id_fkey (
            id,
            username,
            email,
            short_intro
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

  async function acceptFriendRequest(requestId, userId) {
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
        t('friendRequestAcceptedTitle'),
        t('friendRequestAccepted'),
        { type: 'friend_accepted' }
      );

      Alert.alert(t('success'), t('friendRequestAccepted'));
      loadFriends();
      loadPendingRequests();
    } catch (error) {
      console.error('친구 요청 수락 오류:', error);
      Alert.alert(t('error'), t('friendRequestAcceptFailed'));
    }
  };

  async function rejectFriendRequest(requestId) {
    try {
      const { error } = await supabase
        .from('friends')
        .delete()
        .eq('id', requestId);

      if (error) throw error;

      Alert.alert(t('success'), t('friendRequestRejected'));
      loadPendingRequests();
    } catch (error) {
      console.error('친구 요청 거절 오류:', error);
      Alert.alert(t('error'), t('friendRequestRejectFailed'));
    }
  };

  const renderFriendItem = useCallback(function({ item }) {
    return (
      <TouchableOpacity 
        style={styles.friendItem}
        onPress={function() { navigation.navigate('UserProfile', { 
          userId: item.user_profiles.id, 
          userName: item.user_profiles.username 
        }); }}
      >
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={styles.friendInfo}>
            <View>
              <Text style={styles.friendName}>
                {item.user_profiles.username || item.user_profiles.email || t('user')}
              </Text>
              {item.user_profiles.short_intro && (
                <Text style={styles.friendBio} numberOfLines={1}>
                  {item.user_profiles.short_intro}
                </Text>
              )}
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
        </View>
      </TouchableOpacity>
    );
  }, [navigation]);

  const renderRequestItem = useCallback(function({ item }) {
    return (
      <View style={styles.requestItem}>
      <View style={styles.friendInfo}>
        <View>
          <Text style={styles.friendName}>
            {item.user_profiles.username || item.user_profiles.email || t('user')}
          </Text>
          {item.user_profiles.short_intro && (
            <Text style={styles.friendBio} numberOfLines={1}>
              {item.user_profiles.short_intro}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.requestActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.acceptButton]}
          onPress={function() { acceptFriendRequest(item.id, item.user_id); }}
        >
          <Text style={styles.acceptText}>{t('accept')}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.rejectButton]}
          onPress={function() { rejectFriendRequest(item.id); }}
        >
          <Text style={styles.rejectText}>{t('reject')}</Text>
        </TouchableOpacity>
      </View>
    </View>
    );
  }, [acceptFriendRequest, rejectFriendRequest]);

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
        <Text style={styles.title}>{t('friends')}</Text>
        <View style={{ width: 24 }} />
      </View>
      {/* 탭 */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'friends' && styles.tabActive]}
          onPress={function() { setSelectedTab('friends'); }}
        >
          <Text style={[styles.tabText, selectedTab === 'friends' && styles.tabTextActive]}>
            {t('friendsList')} ({friends.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'requests' && styles.tabActive]}
          onPress={function() { setSelectedTab('requests'); }}
        >
          <Text style={[styles.tabText, selectedTab === 'requests' && styles.tabTextActive]}>
            {t('requests')} ({pendingRequests.length})
          </Text>
        </TouchableOpacity>
      </View>
      {/* 리스트 */}
      <FlatList
        data={selectedTab === 'friends' ? friends : pendingRequests}
        renderItem={selectedTab === 'friends' ? renderFriendItem : renderRequestItem}
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
              {selectedTab === 'friends' ? t('noFriendsYet') : t('noRequestsReceived')}
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
    color: '#000000',
  },
  friendBio: {
    ...theme.typography.caption,
    marginLeft: theme.spacing.md,
    color: theme.colors.text.secondary,
    marginTop: 2,
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

