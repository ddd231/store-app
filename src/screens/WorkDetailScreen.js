import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { theme } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { getWorkById, deleteWork } from '../services/workService';
import { getCurrentUserId, supabase } from '../services/supabaseClient';
import { checkUserPremiumStatus } from '../utils/premiumUtils';

export default function WorkDetailScreen({ navigation, route }) {
  const { workId, work: initialWork } = route.params;
  const [work, setWork] = useState(initialWork || null);
  const [loading, setLoading] = useState(!initialWork);
  const [isOwner, setIsOwner] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  useEffect(() => {
    loadWorkDetail();
    checkBookmarkStatus();
  }, [workId]);

  useEffect(() => {
    if (work) {
      checkOwnership();
      saveViewHistory(); // work가 로드된 후 방문 기록 저장
    }
  }, [work]);

  const loadWorkDetail = async () => {
    if (initialWork) {
      setWork(initialWork);
      return;
    }

    try {
      const data = await getWorkById(workId);
      setWork(data);
    } catch (error) {
      console.error('작품 로드 오류:', error);
      Alert.alert('오류', '작품을 불러올 수 없습니다.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const checkOwnership = async () => {
    try {
      const userId = await getCurrentUserId();
      if (userId && work && userId === work.author_id) {
        setIsOwner(true);
      }
    } catch (error) {
      console.error('소유권 확인 오류:', error);
    }
  };

  const checkBookmarkStatus = async () => {
    try {
      const userId = await getCurrentUserId();
      if (!userId || !workId) return;

      const { data, error } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('user_id', userId)
        .eq('work_id', workId)
        .single();

      if (data && !error) {
        setIsBookmarked(true);
      }
    } catch (error) {
      // 북마크가 없는 경우도 정상
    }
  };

  const saveViewHistory = async () => {
    try {
      const userId = await getCurrentUserId();
      if (!userId || !work) return;

      // 프리미엄 사용자인지 확인
      // const isPremium = await checkUserPremiumStatus();
      // if (!isPremium) return; // 프리미엄 사용자가 아니면 기록하지 않음

      // 방문 기록 저장 (upsert로 중복 방지)
      const { error } = await supabase
        .from('view_history')
        .upsert({
          user_id: userId,
          work_id: workId,
          work_title: work.title,
          work_author: work.author_name,
          work_type: work.type,
          viewed_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,work_id'
        });

      if (error) {
        console.error('방문 기록 저장 오류:', error);
      }
    } catch (error) {
      console.error('방문 기록 저장 오류:', error);
    }
  };

  const toggleBookmark = async () => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        Alert.alert('알림', '로그인이 필요한 기능입니다.');
        return;
      }

      if (!workId) {
        console.error('작품 ID가 없습니다');
        Alert.alert('오류', '작품 정보를 찾을 수 없습니다.');
        return;
      }

      setBookmarkLoading(true);

      if (isBookmarked) {
        // 북마크 제거
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', userId)
          .eq('work_id', workId);

        if (error) {
          console.error('북마크 제거 오류:', error);
          throw error;
        }
        setIsBookmarked(false);
      } else {
        // 북마크 추가
        const { data, error } = await supabase
          .from('bookmarks')
          .insert({ user_id: userId, work_id: workId })
          .select();

        if (error) {
          console.error('북마크 추가 오류:', error);
          if (error.code === '23505') {
            Alert.alert('알림', '이미 북마크된 작품입니다.');
            setIsBookmarked(true);
            return;
          }
          throw error;
        }
        setIsBookmarked(true);
      }
    } catch (error) {
      console.error('북마크 토글 오류 상세:', error);
      console.error('오류 메시지:', error.message);
      console.error('오류 코드:', error.code);
      const errorMessage = __DEV__ 
        ? `북마크 처리 중 오류가 발생했습니다.\n${error.message || '알 수 없는 오류'}`
        : '북마크 처리 중 오류가 발생했습니다.';
      Alert.alert('오류', errorMessage);
    } finally {
      setBookmarkLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      '작품 삭제',
      '정말로 이 작품을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '삭제', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteWork(work.id);
              Alert.alert('성공', '작품이 삭제되었습니다.');
              navigation.goBack();
            } catch (error) {
              Alert.alert('오류', '작품 삭제에 실패했습니다.');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!work) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <View style={{ width: 24 }} />
        {isOwner && (
          <TouchableOpacity onPress={() => navigation.navigate('EditWork', { workId: work.id })}>
            <Ionicons name="pencil-outline" size={18} color={theme.colors.text.primary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 그림 작품 - 이미지 */}
        {work.type === 'painting' && work.image_url && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: work.image_url }} style={styles.workImage} resizeMode="contain" />
          </View>
        )}

        {/* 작품 정보 */}
        <View style={styles.infoSection}>
          <Text style={styles.title}>{work.title}</Text>
          <View style={styles.metaInfo}>
            <TouchableOpacity onPress={() => {
              navigation.push('UserProfile', { 
                userId: work.author_id, 
                userName: work.author_name 
              });
            }}>
              <Text style={styles.author}>{work.author_name}</Text>
            </TouchableOpacity>
            <Text style={styles.separator}>·</Text>
            <Text style={styles.category}>{work.category}</Text>
          </View>
          
          {/* 소설 내용 */}
          {work.type === 'novel' && work.content && (
            <View style={styles.novelContent}>
              <Text style={styles.novelText}>{work.content}</Text>
            </View>
          )}

          {/* 작품 설명 */}
          {work.description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionTitle}>
                {work.type === 'painting' ? '작품 설명' : '작품 소개'}
              </Text>
              <Text style={styles.description}>{work.description}</Text>
            </View>
          )}

          {/* 작품 정보 */}
          <View style={styles.statsSection}>
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={20} color={theme.colors.text.secondary} />
              <Text style={styles.statText}>
                {new Date(work.created_at).toLocaleDateString('ko-KR')}
              </Text>
            </View>
          </View>
        </View>

        {/* 액션 버튼들 */}
        <View style={styles.actionSection}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={toggleBookmark}
            disabled={bookmarkLoading}
          >
            <Ionicons 
              name={isBookmarked ? "bookmark" : "bookmark-outline"} 
              size={24} 
              color={isBookmarked ? theme.colors.primary : theme.colors.text.primary} 
            />
            <Text style={[styles.actionText, isBookmarked && { color: theme.colors.primary }]}>
              {isBookmarked ? '북마크됨' : '북마크'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="share-outline" size={24} color={theme.colors.text.primary} />
            <Text style={styles.actionText}>공유</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    marginLeft: theme.spacing.md,
    padding: theme.spacing.xs,
  },
  headerTitle: {
    ...theme.typography.heading,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    backgroundColor: 'white',
  },
  workImage: {
    width: '100%',
    height: 400,
  },
  infoSection: {
    padding: theme.spacing.lg,
  },
  title: {
    ...theme.typography.title,
    fontWeight: 'bold',
    marginBottom: theme.spacing.sm,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  author: {
    ...theme.typography.body,
    fontWeight: '600',
  },
  separator: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    marginHorizontal: theme.spacing.sm,
  },
  category: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
  },
  novelContent: {
    backgroundColor: 'white',
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.medium,
    marginBottom: theme.spacing.lg,
  },
  novelText: {
    ...theme.typography.body,
    lineHeight: 24,
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
  },
  descriptionSection: {
    marginTop: theme.spacing.lg,
  },
  sectionTitle: {
    ...theme.typography.body,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  description: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    lineHeight: 22,
  },
  statsSection: {
    flexDirection: 'row',
    marginTop: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: theme.spacing.xl,
  },
  statText: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.xs,
  },
  actionSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  actionButton: {
    alignItems: 'center',
    padding: theme.spacing.sm,
  },
  actionText: {
    ...theme.typography.caption,
    marginTop: theme.spacing.xs,
  },
});