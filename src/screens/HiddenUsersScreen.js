import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert,
  RefreshControl 
} from 'react-native';
import { theme } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../shared';
import { useAuth } from '../features/auth';

function HiddenUsersScreen({ navigation }) {
  const [hiddenUsers, setHiddenUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(function() {
    checkAccessAndLoad();
  }, [user]);

  async function checkAccessAndLoad() {
    if (!user) {
      navigation.goBack();
      return;
    }

    // 프리미엄 또는 관리자 확인
    const isPremium = user?.user_profiles?.is_premium;
    const isAdmin = user?.user_profiles?.is_admin;

    // 관리자가 아니고 프리미엄이 아닌 경우 접근 차단
    if (!isAdmin && !isPremium) {
      navigation.navigate('Upgrade');
      return;
    }

    loadHiddenUsers();
  };

  async function loadHiddenUsers() {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('hidden_users')
        .select(`
          *,
          hidden_user:user_profiles!hidden_user_id(id, username, email)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('숨긴 사용자 로드 오류:', error);
        Alert.alert('오류', '숨긴 사용자 목록을 불러올 수 없습니다.');
      } else {
        setHiddenUsers(data || []);
      }
    } catch (error) {
      console.error('숨긴 사용자 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  function handleUnhide(hiddenUserId, userName) {
    Alert.alert(
      '숨김 해제',
      `${userName}님을 숨김 해제하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '숨김 해제',
          onPress: function() { unhideUser(hiddenUserId); }
        }
      ]
    );
  };

  async function unhideUser(hiddenUserId) {
    try {
      const { error } = await supabase
        .from('hidden_users')
        .delete()
        .eq('user_id', user.id)
        .eq('hidden_user_id', hiddenUserId);

      if (error) {
        console.error('숨김 해제 오류:', error);
        Alert.alert('오류', '숨김 해제에 실패했습니다.');
      } else {
        Alert.alert('완료', '숨김 해제되었습니다.');
        loadHiddenUsers();
      }
    } catch (error) {
      console.error('숨김 해제 오류:', error);
      Alert.alert('오류', '숨김 해제에 실패했습니다.');
    }
  };

  function renderHiddenUser({ item }) {
    const hiddenUser = item.hidden_user;
    const displayName = hiddenUser?.username || hiddenUser?.email?.split('@')[0] || '알 수 없는 사용자';
    
    return (
      <View style={styles.userItem}>
        <View style={styles.userInfo}>
          <View style={styles.userIcon}>
            <Ionicons name="person" size={24} color={theme.colors.text.secondary} />
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{displayName}</Text>
            <Text style={styles.userEmail}>{hiddenUser?.email}</Text>
            <Text style={styles.hiddenDate}>
              숨김 날짜: {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.unhideButton}
          onPress={function() { handleUnhide(hiddenUser.id, displayName); }}
        >
          <Ionicons name="eye" size={20} color={theme.colors.primary} />
          <Text style={styles.unhideText}>숨김 해제</Text>
        </TouchableOpacity>
      </View>
    );
  };

  function renderEmptyState() {
    return (
      <View style={styles.emptyState}>
      <Ionicons name="eye-off-outline" size={64} color={theme.colors.text.secondary} />
      <Text style={styles.emptyTitle}>숨긴 사용자가 없습니다</Text>
      <Text style={styles.emptyDescription}>
        다른 사용자를 숨기면 여기에 표시됩니다
      </Text>
    </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={function() { navigation.goBack(); }}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>숨긴사용자 관리</Text>
        <View style={styles.headerRight} />
      </View>

      {/* 설명 */}
      <View style={styles.description}>
        <Text style={styles.descriptionText}>
          숨긴 사용자의 작품이나 활동이 피드에 표시되지 않습니다.
        </Text>
      </View>

      {/* 숨긴 사용자 목록 */}
      <FlatList
        data={hiddenUsers}
        renderItem={renderHiddenUser}
        keyExtractor={function(item) { return item.id; }}
        style={styles.list}
        contentContainerStyle={hiddenUsers.length === 0 ? styles.emptyContainer : null}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadHiddenUsers}
            colors={[theme.colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: theme.spacing.sm,
  },
  headerTitle: {
    ...theme.typography.heading,
    fontSize: 22,
    fontWeight: '600',
  },
  headerRight: {
    width: 40,
  },
  description: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  descriptionText: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  list: {
    flex: 1,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    ...theme.typography.body,
    fontWeight: '600',
    marginBottom: 2,
  },
  userEmail: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginBottom: 2,
  },
  hiddenDate: {
    ...theme.typography.small,
    color: theme.colors.text.secondary,
  },
  unhideButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  unhideText: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  emptyTitle: {
    ...theme.typography.heading,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptyDescription: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default HiddenUsersScreen;