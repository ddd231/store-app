import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { theme } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { checkPremiumAccess } from '../utils/premiumUtils';
import { supabase } from '../services/supabaseClient';

export default function ViewHistoryScreen({ navigation }) {
  const [viewHistory, setViewHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    // const hasAccess = await checkPremiumAccess(navigation, '봤던 기록 보기');
    // if (hasAccess) {
    //   loadViewHistory();
    // } else {
    //   navigation.goBack();
    // }
    loadViewHistory(); // 임시로 모든 사용자 접근 가능
  };

  const loadViewHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('view_history')
        .select('*')
        .eq('user_id', user.id)
        .order('viewed_at', { ascending: false })
        .limit(200); // 최대 200개

      if (error) {
        console.error('봤던 기록 로드 오류:', error);
        Alert.alert('오류', '기록을 불러오는데 실패했습니다.');
      } else {
        setViewHistory(data || []);
      }
    } catch (error) {
      console.error('봤던 기록 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderHistoryItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.historyItem}
      onPress={() => navigation.navigate('WorkDetail', { workId: item.work_id })}
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

  const clearHistory = () => {
    Alert.alert(
      '기록 삭제',
      '모든 봤던 기록을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return;

              const { error } = await supabase
                .from('view_history')
                .delete()
                .eq('user_id', user.id);

              if (error) {
                Alert.alert('오류', '기록 삭제에 실패했습니다.');
              } else {
                setViewHistory([]);
                Alert.alert('완료', '봤던 기록이 모두 삭제되었습니다.');
              }
            } catch (error) {
              console.error('기록 삭제 오류:', error);
              Alert.alert('오류', '기록 삭제에 실패했습니다.');
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
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>기록</Text>
        <TouchableOpacity onPress={clearHistory}>
          <Ionicons name="trash-outline" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* 프리미엄 뱃지 */}
      <View style={styles.premiumBadge}>
        <Text style={styles.premiumText}>전문가 전용 기능</Text>
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
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="eye-outline" size={60} color={theme.colors.text.secondary} />
          <Text style={styles.emptyText}>아직 본 작품이 없습니다</Text>
          <Text style={styles.emptySubtext}>작품을 감상하면 여기에 기록됩니다</Text>
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