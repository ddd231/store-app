import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, RefreshControl, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../../../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../shared';
import { useAuth } from '../../auth/hooks/useAuth';

export default function BookmarksScreen({ navigation, route }) {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  // 화면이 focus될 때마다 프리미엄 상태 확인 및 북마크 로드
  useFocusEffect(
    React.useCallback(function() {
      loadBookmarks();
    }, [])
  );

  // 프리미엄 상태 업데이트 감지
  useEffect(function() {
    if (route.params?.premiumUpdated) {
      loadBookmarks();
    }
  }, [route.params?.premiumUpdated]);

  async function loadBookmarks() {
    try {
      // useAuth의 전역 user 상태 사용 (최신 프로필 정보 포함)
      if (!user) {
        setBookmarks([]);
        setLoading(false);
        return;
      }

      // 프리미엄 또는 관리자 확인
      const isPremium = user?.user_profiles?.is_premium;
      const isAdmin = user?.user_profiles?.is_admin;

      // 관리자가 아니고 프리미엄이 아닌 경우 접근 차단
      if (!isAdmin && !isPremium) {
        setBookmarks([]);
        setLoading(false);
        navigation.navigate('Upgrade');
        return;
      }

      // 북마크한 작품들 가져오기
      const { data: bookmarkData, error } = await supabase
        .from('bookmarks')
        .select(`
          id,
          created_at,
          work:works (
            id,
            title,
            content,
            image_url,
            type,
            category,
            author_id,
            author_name,
            created_at
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // work가 null이 아닌 것만 필터링 (삭제된 작품 제외)
      const validBookmarks = bookmarkData?.filter(function(b) { return b.work !== null; }) || [];
      setBookmarks(validBookmarks);
    } catch (error) {
      console.error('북마크 로드 오류:', error);
      setBookmarks([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  function onRefresh() {
    setRefreshing(true);
    loadBookmarks();
  };

  async function removeBookmark(bookmarkId) {
    try {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', bookmarkId);

      if (error) throw error;

      // 로컬 상태 업데이트
      setBookmarks(function(prev) { return prev.filter(function(b) { return b.id !== bookmarkId; }); });
    } catch (error) {
      console.error('북마크 삭제 오류:', error);
    }
  };

  function renderBookmarkItem({ item }) {
    const work = item.work;
    
    return (
      <TouchableOpacity 
        style={styles.bookmarkCard}
        onPress={function() { navigation.navigate('WorkDetail', { workId: work.id, work }); }}
      >
        <View style={styles.workContent}>
          {work.type === 'novel' && work.content ? (
            <View style={styles.novelPreview}>
              <Text style={styles.novelPreviewText} numberOfLines={4}>
                {work.content}
              </Text>
            </View>
          ) : work.image_url ? (
            <Image source={{ uri: work.image_url }} style={styles.workImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons 
                name={work.type === 'painting' ? 'color-palette-outline' : 'book-outline'} 
                size={40} 
                color={theme.colors.text.secondary} 
              />
            </View>
          )}
          
          <View style={styles.workInfo}>
            <Text style={styles.workTitle} numberOfLines={1}>{work.title}</Text>
            <Text style={styles.workAuthor} numberOfLines={1}>{work.author_name}</Text>
            <Text style={styles.workCategory}>{work.category}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.removeButton}
          onPress={function() { removeBookmark(item.id); }}
        >
          <Ionicons name="bookmark" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={function() { navigation.goBack(); }}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>북마크</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* 프리미엄 뱃지 */}
      <View style={styles.premiumBadge}>
        <Text style={styles.premiumText}>전문가 전용기능</Text>
      </View>

      {/* 콘텐츠 */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={bookmarks}
          renderItem={renderBookmarkItem}
          keyExtractor={function(item) { return item.id; }}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="bookmark-outline" size={60} color={theme.colors.text.secondary} />
              <Text style={styles.emptyText}>아직 북마크한 작품이 없습니다</Text>
            </View>
          }
        />
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
    padding: theme.spacing.lg,
    paddingBottom: 100,
  },
  bookmarkCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.small,
  },
  workContent: {
    flex: 1,
    flexDirection: 'row',
  },
  workImage: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.small,
  },
  novelPreview: {
    width: 80,
    height: 80,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.small,
    padding: theme.spacing.sm,
    justifyContent: 'center',
  },
  novelPreviewText: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    fontSize: 10,
  },
  placeholderImage: {
    width: 80,
    height: 80,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workInfo: {
    flex: 1,
    marginLeft: theme.spacing.md,
    justifyContent: 'center',
  },
  workTitle: {
    ...theme.typography.body,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  workAuthor: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginBottom: 2,
  },
  workCategory: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
  },
  removeButton: {
    padding: theme.spacing.sm,
    justifyContent: 'center',
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
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.md,
  },
});

