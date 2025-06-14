import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Alert, Image, Dimensions, Platform } from 'react-native';
import { theme } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabaseClient';
import AnimatedButton from '../components/AnimatedButton';

const { width } = Dimensions.get('window');
const cardWidth = (width - theme.spacing.lg * 2 - theme.spacing.md) / 2;

export default function GalleryDetailScreen({ navigation, route }) {
  const { galleryId } = route.params;
  const [gallery, setGallery] = useState(null);
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadGalleryData();
    checkCurrentUser();
  }, [galleryId]);

  const checkCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const loadGalleryData = async () => {
    try {
      setLoading(true);

      // 갤러리 정보 가져오기
      const { data: galleryData, error: galleryError } = await supabase
        .from('galleries')
        .select('*')
        .eq('id', galleryId)
        .single();

      if (galleryError) throw galleryError;
      setGallery(galleryData);

      // 갤러리에 포함된 작품들 가져오기
      if (galleryData.work_ids && galleryData.work_ids.length > 0) {
        const { data: worksData, error: worksError } = await supabase
          .from('works')
          .select('*')
          .in('id', galleryData.work_ids);

        if (!worksError) {
          setWorks(worksData || []);
        }
      }
    } catch (error) {
      console.error('갤러리 로드 오류:', error);
      Alert.alert('오류', '갤러리를 불러올 수 없습니다.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGallery = () => {
    Alert.alert(
      '갤러리 삭제',
      '정말로 이 갤러리를 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { text: '삭제', style: 'destructive', onPress: deleteGallery }
      ]
    );
  };

  const deleteGallery = async () => {
    try {
      const { error } = await supabase
        .from('galleries')
        .delete()
        .eq('id', galleryId);

      if (error) throw error;

      Alert.alert('성공', '갤러리가 삭제되었습니다.');
      navigation.goBack();
    } catch (error) {
      console.error('갤러리 삭제 오류:', error);
      Alert.alert('오류', '갤러리 삭제에 실패했습니다.');
    }
  };

  const renderWorkItem = ({ item }) => (
    <AnimatedButton 
      style={styles.workCard}
      onPress={() => navigation.navigate('WorkDetail', { workId: item.id, work: item })}
      animationType="none"
    >
      {item.type === 'novel' && item.content ? (
        <View style={styles.novelPreview}>
          <Text style={styles.novelPreviewText} numberOfLines={8}>
            {item.content}
          </Text>
        </View>
      ) : item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.workImage} />
      ) : (
        <View style={styles.workPlaceholder}>
          <Ionicons 
            name={item.type === 'painting' ? 'color-palette-outline' : 'book-outline'}
            size={40} 
            color={theme.colors.text.secondary} 
          />
        </View>
      )}
      <Text style={styles.workTitle} numberOfLines={1}>{item.title}</Text>
      <Text style={styles.workCategory}>{item.category}</Text>
    </AnimatedButton>
  );

  if (loading || !gallery) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>로딩 중...</Text>
      </View>
    );
  }

  const isOwner = currentUser && currentUser.id === gallery.creator_id;

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{gallery.name}</Text>
        {isOwner && (
          <TouchableOpacity onPress={() => navigation.navigate('EditGallery', { galleryId: gallery.id })}>
            <Ionicons name="pencil-outline" size={18} color={theme.colors.text.primary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 갤러리 정보 */}
        <View style={styles.galleryInfo}>
          <Text style={styles.galleryName}>{gallery.name}</Text>
          {gallery.description && (
            <Text style={styles.galleryDescription}>{gallery.description}</Text>
          )}
          <Text style={styles.galleryStats}>{works.length}개 작품</Text>
        </View>

        {/* 작품 목록 */}
        <View style={styles.worksSection}>
          <Text style={styles.sectionTitle}>작품 목록</Text>
          
          {works.length > 0 ? (
            <FlatList
              data={works}
              renderItem={renderWorkItem}
              keyExtractor={item => item.id}
              numColumns={2}
              columnWrapperStyle={works.length > 1 ? styles.worksRow : null}
              scrollEnabled={false}
              style={styles.worksList}
            />
          ) : (
            <Text style={styles.emptyText}>이 갤러리에는 작품이 없습니다</Text>
          )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    paddingTop: 50, // 상태바 높이만큼 추가
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  headerTitle: {
    ...theme.typography.heading,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: theme.spacing.md,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
  },
  galleryInfo: {
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  galleryName: {
    ...theme.typography.heading,
    fontWeight: '700',
    marginBottom: theme.spacing.sm,
  },
  galleryDescription: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    lineHeight: 22,
    marginBottom: theme.spacing.sm,
  },
  galleryStats: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
  },
  worksSection: {
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    ...theme.typography.body,
    fontWeight: '600',
    marginBottom: theme.spacing.md,
  },
  worksList: {
    marginTop: theme.spacing.sm,
  },
  worksRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 0,
  },
  workCard: {
    width: cardWidth,
    marginBottom: theme.spacing.lg,
  },
  workImage: {
    width: '100%',
    height: cardWidth * 1.2,
    borderRadius: theme.borderRadius.medium,
    backgroundColor: theme.colors.background,
    marginBottom: theme.spacing.sm,
  },
  workPlaceholder: {
    width: '100%',
    height: cardWidth * 1.2,
    borderRadius: theme.borderRadius.medium,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  novelPreview: {
    width: '100%',
    height: cardWidth * 1.2,
    borderRadius: theme.borderRadius.medium,
    backgroundColor: 'white',
    padding: theme.spacing.sm,
    overflow: 'hidden',
  },
  novelPreviewText: {
    fontSize: 16,
    lineHeight: 22,
    color: theme.colors.text.primary,
    textAlign: 'left',
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
  },
  workTitle: {
    ...theme.typography.body,
    fontWeight: '600',
    marginBottom: 2,
  },
  workCategory: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.lg,
  },
});