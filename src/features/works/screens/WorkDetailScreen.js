import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert, ActivityIndicator, Platform, Share, Modal, Dimensions } from 'react-native';
import { theme } from '../../../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { getWorkById, deleteWork } from '../services/workService';
import { supabase } from '../../../shared';
import { useAuth } from '../../auth/hooks/useAuth';
import { useLanguage } from '../../../contexts/LanguageContext';

export default function WorkDetailScreen({ navigation, route }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { workId, work: initialWork } = route.params;
  const [work, setWork] = useState(initialWork || null);
  const [loading, setLoading] = useState(!initialWork);
  const [isOwner, setIsOwner] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);

  useEffect(function() {
    loadWorkDetail();
    checkBookmarkStatus();
  }, [workId]);

  useEffect(function() {
    if (work) {
      checkOwnership();
      saveViewHistory(); // work가 로드된 후 방문 기록 저장
    }
  }, [work]);

  async function loadWorkDetail() {
    if (initialWork) {
      setWork(initialWork);
      return;
    }

    try {
      const data = await getWorkById(workId);
      setWork(data);
    } catch (error) {
      console.error('작품 로드 오류:', error);
      Alert.alert(t('error'), t('workLoadError'));
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  async function checkOwnership() {
    try {
      const userId = await getCurrentUserId();
      setIsOwner(userId === work?.author_id);
    } catch (error) {
      console.error('소유권 확인 오류:', error);
    }
  };

  async function checkBookmarkStatus() {
    try {
      const userId = await getCurrentUserId();
      if (!userId || !workId) return;

      const { data } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('user_id', userId)
        .eq('work_id', workId)
        .single();

      setIsBookmarked(!!data);
    } catch (error) {
      setIsBookmarked(false);
    }
  };

  async function saveViewHistory() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !work) return;

      const userId = user.id;
      
      // 본인 작품은 방문 기록에 저장하지 않음
      if (userId === work.author_id) return;

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

  async function toggleBookmark() {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        Alert.alert(t('notification'), t('loginRequiredForFeature'));
        return;
      }

      if (!workId) {
        Alert.alert(t('error'), t('workNotFound'));
        return;
      }

      setBookmarkLoading(true);

      if (isBookmarked) {
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', userId)
          .eq('work_id', workId);

        if (error) throw error;
        setIsBookmarked(false);
      } else {
        const { error } = await supabase
          .from('bookmarks')
          .insert({ user_id: userId, work_id: workId });

        if (error) {
          if (error.code === '23505') {
            setIsBookmarked(true);
            return;
          }
          throw error;
        }
        setIsBookmarked(true);
      }
    } catch (error) {
      console.error('북마크 토글 오류:', error);
      Alert.alert(t('error'), t('bookmarkError'));
    } finally {
      setBookmarkLoading(false);
    }
  };

  async function handleShare() {
    try {
      const shareOptions = {
        message: `${work.title} - ${work.author_name}\n\n${work.description || ''}`,
        title: work.title,
      };

      if (work.image_url) {
        shareOptions.url = work.image_url;
      }

      await Share.share(shareOptions);
    } catch (error) {
      console.error('공유 오류:', error);
    }
  };

  function handleDelete() {
    Alert.alert(
      t('deleteWork'),
      t('confirmDeleteWork'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('delete'), 
          style: 'destructive',
          onPress: async function() {
            try {
              await deleteWork(work.id);
              Alert.alert(t('success'), t('workDeleted'));
              navigation.goBack();
            } catch (error) {
              Alert.alert(t('error'), t('deleteWorkFailed'));
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
        <TouchableOpacity onPress={function() { navigation.goBack(); }}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <View style={{ width: 24 }} />
        {isOwner && (
          <TouchableOpacity onPress={function() { navigation.navigate('EditWork', { workId: work.id }); }}>
            <Ionicons name="pencil-outline" size={18} color={theme.colors.text.primary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 그림 작품 - 이미지 */}
        {work.type === 'painting' && work.image_url && (
          <TouchableOpacity activeOpacity={1} onPress={function() { setImageModalVisible(true); }}>
            <Image source={{ uri: work.image_url }} style={styles.workImage} resizeMode="contain" />
          </TouchableOpacity>
        )}

        {/* 작품 정보 */}
        <View style={styles.infoSection}>
          <Text style={styles.title}>{work.title}</Text>
          <View style={styles.metaInfo}>
            <TouchableOpacity onPress={function() {
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
                {work.type === 'painting' ? t('workDescription') : t('workIntroduction')}
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
              {isBookmarked ? t('bookmarked') : t('bookmark')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={24} color={theme.colors.text.primary} />
            <Text style={styles.actionText}>{t('share')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 이미지 전체화면 모달 */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={function() { setImageModalVisible(false); }}
      >
        <TouchableOpacity 
          style={styles.modalContainer} 
          activeOpacity={1} 
          onPress={function() { setImageModalVisible(false); }}
        >
          <Image 
            source={{ uri: work?.image_url }} 
            style={styles.fullScreenImage} 
            resizeMode="contain" 
          />
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={function() { setImageModalVisible(false); }}
          >
            <Ionicons name="close" size={30} color="white" />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 120,
  },
  imageContainer: {
    width: '100%',
    backgroundColor: 'white',
    marginHorizontal: 0,
    paddingHorizontal: 0,
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
    color: '#000000',
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
    flexShrink: 1,
  },
  novelContent: {
    backgroundColor: 'white',
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.medium,
    marginBottom: theme.spacing.lg,
  },
  novelText: {
    ...theme.typography.body,
    color: '#000000',
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
    paddingVertical: theme.spacing.xl,
    marginTop: theme.spacing.xl,
    backgroundColor: theme.colors.background,
  },
  actionButton: {
    alignItems: 'center',
    padding: theme.spacing.sm,
  },
  actionText: {
    ...theme.typography.caption,
    marginTop: theme.spacing.xs,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
  },
});

