import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { theme } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../shared';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../features/auth';
import { useFocusEffect } from '@react-navigation/native';

function ViewHistoryScreen({ navigation, route }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [viewHistory, setViewHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // 화면이 focus될 때마다 프리미엄 상태 확인
  useFocusEffect(
    React.useCallback(function() {
      checkAccess();
    }, [])
  );

  // 프리미엄 상태 업데이트 감지
  useEffect(function() {
    if (route.params?.premiumUpdated) {
      checkAccess();
    }
  }, [route.params?.premiumUpdated]);

  async function checkAccess() {
    try {
      console.log('[ViewHistory] 권한 확인 시작');
      
      // 현재 사용자 확인
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        console.log('[ViewHistory] 사용자 없음');
        navigation.goBack();
        return;
      }

      console.log('[ViewHistory] 현재 user:', currentUser);

      // 직접 프로필 조회
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      console.log('[ViewHistory] 프로필 조회 결과:', { profile, error });

      if (error || !profile) {
        console.log('[ViewHistory] 프로필 조회 실패');
        navigation.goBack();
        return;
      }

      // 프리미엄 또는 관리자 확인
      const isPremium = profile?.is_premium;
      const isAdmin = profile?.is_admin || currentUser.email === 'lsg5235@gmail.com';

      console.log('[ViewHistory] 권한 상태:', { isPremium, isAdmin });

      // 관리자가 아니고 프리미엄이 아닌 경우 접근 차단
      if (!isAdmin && !isPremium) {
        console.log('[ViewHistory] 프리미엄 권한 없음 - 업그레이드 페이지로 이동');
        navigation.navigate('Upgrade');
        return;
      }

      console.log('[ViewHistory] 권한 확인 완료 - 기록 로드');
      loadViewHistory();
    } catch (error) {
      console.error('접근 권한 확인 오류:', error);
      navigation.goBack();
    }
  };

  async function loadViewHistory() {
    try {
      // 현재 사용자 확인
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('view_history')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('viewed_at', { ascending: false })
        .limit(200); // 최대 200개

      if (error) {
        console.error('봤던 기록 로드 오류:', error);
        Alert.alert(t('error'), t('loadHistoryFailed'));
      } else {
        setViewHistory(data || []);
      }
    } catch (error) {
      console.error('봤던 기록 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  function renderHistoryItem({ item }) {
    return (
      <TouchableOpacity 
      style={styles.historyItem}
      onPress={function() { navigation.navigate('WorkDetail', { workId: item.work_id }); }}
    >
      <View style={styles.itemContent}>
        <Ionicons 
          name={item.work_type === 'painting' ? 'color-palette-outline' : 'book-outline'} 
          size={24} 
          color={theme.colors.primary} 
          style={styles.itemIcon}
        />
        <View style={styles.itemText}>
          <View style={styles.titleRow}>
            <Text style={styles.itemTitle}>{item.work_title}</Text>
            <Text style={styles.itemAuthor}>{item.work_author}</Text>
          </View>
          <Text style={styles.itemDate}>
            {new Date(item.viewed_at).toLocaleDateString('ko-KR')}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
    </TouchableOpacity>
    );
  }

  function clearHistory() {
    Alert.alert(
      t('deleteHistory'),
      t('confirmDeleteAllHistory'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async function() {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return;

              const { error } = await supabase
                .from('view_history')
                .delete()
                .eq('user_id', user.id);

              if (error) {
                Alert.alert(t('error'), t('deleteHistoryFailed'));
              } else {
                setViewHistory([]);
                Alert.alert(t('done'), t('allHistoryDeleted'));
              }
            } catch (error) {
              console.error('기록 삭제 오류:', error);
              Alert.alert(t('error'), t('deleteHistoryFailed'));
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={function() { navigation.goBack(); }}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('history')}</Text>
        <TouchableOpacity onPress={clearHistory}>
          <Ionicons name="trash-outline" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* 프리미엄 뱃지 */}
      <View style={styles.premiumBadge}>
        <Text style={styles.premiumText}>{t('expertOnlyFeature')}</Text>
      </View>

      {/* 기록 리스트 */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : viewHistory.length > 0 ? (
        <FlatList
          data={viewHistory}
          renderItem={renderHistoryItem}
          keyExtractor={function(item) { return item.id; }}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={function() { return <View style={styles.separator} />; }}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="eye-outline" size={60} color={theme.colors.text.secondary} />
          <Text style={styles.emptyText}>{t('noViewedWorks')}</Text>
          <Text style={styles.emptySubtext}>{t('worksWillBeRecorded')}</Text>
        </View>
      )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 60,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    ...theme.typography.heading,
    fontSize: 22,
    fontWeight: '600',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    backgroundColor: '#FFF9E6',
    borderBottomWidth: 1,
    borderBottomColor: '#FFE69C',
  },
  premiumText: {
    ...theme.typography.caption,
    color: '#B8860B',
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 100,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    backgroundColor: 'white',
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemIcon: {
    marginRight: theme.spacing.md,
  },
  itemText: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  itemTitle: {
    ...theme.typography.body,
    fontWeight: '600',
    color: '#000000',
    marginRight: 13,
  },
  itemAuthor: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
  },
  itemDate: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    fontSize: 11,
  },
  separator: {
    height: 0.5,
    backgroundColor: theme.colors.border,
    marginLeft: theme.spacing.lg,
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

export default ViewHistoryScreen;