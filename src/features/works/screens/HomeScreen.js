import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Dimensions, Platform, TextInput, ActivityIndicator, RefreshControl, ScrollView, Modal, Animated } from 'react-native';
import { theme } from '../../../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import HomeMenu from '../../../components/HomeMenu';
import { getWorks } from '../services/workService';
import { useLanguage } from '../../../contexts/LanguageContext';
import { OptimizedImage, useDebounce } from '../../../shared';

const { width } = Dimensions.get('window');
const cardWidth = (width - 16 * 2 - theme.spacing.md) / 2;

export default function HomeScreen({ navigation }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [menuVisible, setMenuVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [sortBy, setSortBy] = useState('latest'); // latest, oldest, random
  const [modalAnimating, setModalAnimating] = useState(false);
  const modalSlideAnim = React.useRef(new Animated.Value(600)).current; // 더 아래에서 시작
  const backdropOpacityAnim = React.useRef(new Animated.Value(0)).current;
  
  const { t } = useLanguage();
  
  // 검색어 디바운싱 (500ms 지연)
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  
  const categories = [
    { id: 'all', name: t('allCategories') },
    { id: 'novel', name: t('novelCategory') },
    { id: 'painting', name: t('paintingCategory') },
  ];

  // 작품 데이터 로드
  async function loadWorks(isInitial = false) {
    try {
      if (!isInitial) {
        setCategoryLoading(true);
      }
      const data = await getWorks(selectedCategory);
      setArtworks(data);
    } catch (error) {
      console.error('작품 로드 오류:', error);
      // 오류 시 빈 배열로 설정
      setArtworks([]);
    } finally {
      if (isInitial) {
        setLoading(false);
      } else {
        setCategoryLoading(false);
      }
      setRefreshing(false);
    }
  };

  // 초기 로드
  useEffect(function() {
    loadWorks(true);
  }, []);

  // 카테고리 변경 시 데이터 다시 로드
  useEffect(function() {
    if (artworks.length > 0) { // 초기 로드가 아니면
      loadWorks(false);
    }
  }, [selectedCategory]);


  // 당겨서 새로고침
  function onRefresh() {
    setRefreshing(true);
    loadWorks();
  };

  // 모달 열기 애니메이션
  function openModal() {
    // 모달을 초기 위치로 즉시 설정 (화면 완전히 밖)
    modalSlideAnim.setValue(600);
    backdropOpacityAnim.setValue(0);
    
    setFilterVisible(true);
    
    // requestAnimationFrame을 사용하여 다음 프레임에서 애니메이션 시작
    requestAnimationFrame(function() { 
      // 배경과 모달을 동시에 애니메이션
      Animated.parallel([
        Animated.timing(backdropOpacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: false, // opacity는 native driver를 사용할 수 없음
        }),
        Animated.spring(modalSlideAnim, {
          toValue: 0,
          tension: 55,
          friction: 11,
          useNativeDriver: true,
        })
      ]).start();
    });
  };

  // 모달 닫기 애니메이션
  function closeModal() {
    // 모달만 스프링으로 빠르게 내리고 배경은 따로
    Animated.spring(modalSlideAnim, {
      toValue: 600,
      tension: 200,
      friction: 8,
      useNativeDriver: true,
    }).start();
    
    Animated.timing(backdropOpacityAnim, {
      toValue: 0,
      duration: 50,
      useNativeDriver: false,
    }).start(function() {
      setFilterVisible(false);
    });
  };

  // 검색 필터링 (디바운싱된 검색어 사용)
  const filteredArtworks = useMemo(function() {
    if (!debouncedSearchQuery.trim()) return artworks;
    const query = debouncedSearchQuery.toLowerCase();
    return artworks.filter(function(work) {
      return work.title?.toLowerCase().includes(query) ||
        work.description?.toLowerCase().includes(query) ||
        work.category?.toLowerCase().includes(query);
    });
  }, [artworks, debouncedSearchQuery]);

  // 정렬 (최적화 - 랜덤 정렬 안정화)
  const sortedArtworks = useMemo(function() {
    const toSort = [...filteredArtworks];
    
    switch (sortBy) {
      case 'latest':
        return toSort.sort(function(a, b) { return new Date(b.created_at) - new Date(a.created_at); });
      case 'oldest':
        return toSort.sort(function(a, b) { return new Date(a.created_at) - new Date(b.created_at); });
      case 'random':
        // 안정적인 랜덤 정렬을 위해 ID를 시드로 사용
        return toSort.sort(function(a, b) {
          const seedA = parseInt(a.id?.toString().slice(-3) || '0', 10);
          const seedB = parseInt(b.id?.toString().slice(-3) || '0', 10);
          return seedA - seedB;
        });
      default:
        return toSort;
    }
  }, [filteredArtworks, sortBy]);

  const SmoothCard = React.memo(function({ item, onPress, children }) {
    return (
      <TouchableOpacity
        style={styles.artworkCard}
        onPress={onPress}
        activeOpacity={1.0}
      >
        {children}
      </TouchableOpacity>
    );
  });

  // 메모이제이션된 렌더 아이템
  const renderArtworkItem = useCallback(function({ item }) {
    return (
      <SmoothCard 
      item={item}
      onPress={function() { navigation.navigate('WorkDetail', { workId: item.id, work: item }); }}
    >
      <View style={styles.artworkImage}>
        {item.type === 'novel' && item.content ? (
          <View style={styles.novelPreviewHome}>
            <Text style={styles.novelPreviewTextHome} numberOfLines={8}>
              {item.content}
            </Text>
          </View>
        ) : item.image_url ? (
          <OptimizedImage 
            source={{ uri: item.image_url }} 
            style={styles.image}
            width={cardWidth}
            height={cardWidth * 0.75}
            quality="medium"
            enableLazyLoading={true}
            placeholder="이미지 로딩 중..."
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons 
              name={item.type === 'painting' ? 'color-palette-outline' : 'book-outline'} 
              size={40} 
              color={theme.colors.text.secondary} 
            />
          </View>
        )}
      </View>
      <View style={styles.artworkInfo}>
        <Text style={styles.artworkTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.artworkAuthor} numberOfLines={1}>by {item.author_name}</Text>
        <Text style={styles.artworkCategory} numberOfLines={1}>{item.category}</Text>
      </View>
    </SmoothCard>
    );
  }, [navigation]);

  // FlatList 최적화 함수들
  const keyExtractor = useCallback(function(item) { return item.id; }, []);
  
  const getItemLayout = useCallback(function(data, index) {
    const itemHeight = cardWidth * 0.75 + 60; // 이미지 높이 + 텍스트 영역
    return {
      length: itemHeight,
      offset: itemHeight * Math.floor(index / 2), // 2열 그리드
      index,
    };
  }, []);

  return (
    <View style={styles.container}>

      {/* 작품 그리드 */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
            data={categoryLoading ? [] : sortedArtworks}
            renderItem={renderArtworkItem}
            keyExtractor={keyExtractor}
            numColumns={2}
            contentContainerStyle={styles.gridContent}
            columnWrapperStyle={styles.row}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.colors.primary}
              />
            }
            // 성능 최적화 props
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            updateCellsBatchingPeriod={50}
            initialNumToRender={8}
            windowSize={21}
            getItemLayout={getItemLayout}
          ListEmptyComponent={categoryLoading ? (
            <View style={styles.categoryLoadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>{t('loadingWorks')}</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="image-outline" size={64} color={theme.colors.text.secondary} />
              <Text style={styles.emptyText}>{t('noWorks')}</Text>
            </View>
          )}
          ListHeaderComponent={
            <View>
              {/* 헤더 */}
              <View style={styles.headerInList}>
                <View style={{ width: 44 }} />
                <Text style={styles.title}>ARLD</Text>
                <TouchableOpacity 
                  style={[styles.menuButton, { transform: [{ translateX: 10 }] }]}
                  onPress={function() { setMenuVisible(true); }}
                >
                  <Ionicons name="menu" size={28} color={theme.colors.text.primary} />
                </TouchableOpacity>
              </View>

              {/* 검색창 */}
              <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                  <Ionicons name="search" size={20} color={theme.colors.text.secondary} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder=""
                    placeholderTextColor={theme.colors.text.placeholder}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    maxLength={100}
                  />
                </View>
              </View>

              {/* 카테고리 필터 */}
              <View style={[styles.categoryContainer, { marginBottom: theme.spacing.xl }]}>
                {categories.map(function(category) {
                  return (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryButton,
                        selectedCategory === category.id && styles.categoryButtonActive
                      ]}
                      onPress={function() { setSelectedCategory(category.id); }}
                    >
                      <Text style={[
                        styles.categoryText,
                        selectedCategory === category.id && styles.categoryTextActive
                      ]}>
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                
                <TouchableOpacity 
                  style={styles.filterButton}
                  onPress={openModal}
                >
                  <Ionicons name="filter" size={20} color={theme.colors.text.primary} />
                </TouchableOpacity>
              </View>
            </View>
          }
          />
      )}


      {/* 메뉴 */}
      <HomeMenu 
        visible={menuVisible}
        onClose={function() { setMenuVisible(false); }}
        navigation={navigation}
      />

      {/* 필터 팝업 - 전체 화면 모달 */}
      <Modal
        visible={filterVisible}
        transparent={true}
        animationType="none"
        onRequestClose={closeModal}
      >
        <Animated.View 
          style={[styles.filterBackdrop, { 
            opacity: backdropOpacityAnim
          }]}
        >
          <TouchableOpacity 
            style={{ flex: 1 }}
            activeOpacity={1} 
            onPress={closeModal}
          />
          <Animated.View 
            style={[styles.filterModal, {
              transform: [{ translateY: modalSlideAnim }]
            }]}
          >
            <View style={styles.filterHandle} />
            <Text style={styles.filterTitle}>{t('sortBy')}</Text>
            
            <TouchableOpacity
              style={[styles.filterOption, sortBy === 'latest' && styles.filterOptionActive]}
              onPress={function() {
                setSortBy('latest');
                closeModal();
              }}
            >
              <Text style={[styles.filterOptionText, sortBy === 'latest' && styles.filterOptionTextActive]}>
                {t('latest')}
              </Text>
              {sortBy === 'latest' && (
                <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterOption, sortBy === 'oldest' && styles.filterOptionActive]}
              onPress={function() {
                setSortBy('oldest');
                closeModal();
              }}
            >
              <Text style={[styles.filterOptionText, sortBy === 'oldest' && styles.filterOptionTextActive]}>
                {t('oldest')}
              </Text>
              {sortBy === 'oldest' && (
                <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterOption, sortBy === 'random' && styles.filterOptionActive]}
              onPress={function() {
                setSortBy('random');
                closeModal();
              }}
            >
              <Text style={[styles.filterOptionText, sortBy === 'random' && styles.filterOptionTextActive]}>
                {t('random')}
              </Text>
              {sortBy === 'random' && (
                <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
              )}
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </Modal>
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
    paddingTop: 74,
    paddingBottom: theme.spacing.xl,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#000000',
    letterSpacing: -1,
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
    transform: [{ translateY: -10 }],
  },
  menuButton: {
    padding: theme.spacing.sm,
    marginTop: -15,
  },
  categoryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 0,
    marginBottom: theme.spacing.xs,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginRight: theme.spacing.sm,
    borderRadius: 0,
    backgroundColor: 'transparent',
  },
  categoryButtonActive: {
    backgroundColor: 'transparent',
    borderBottomWidth: 1.5,
    borderBottomColor: theme.colors.primary,
  },
  categoryText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  filterButton: {
    marginLeft: theme.spacing.md,
    padding: theme.spacing.sm,
    backgroundColor: 'transparent',
    borderRadius: theme.borderRadius.small,
  },
  gridContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  row: {
    justifyContent: 'space-between',
  },
  artworkCard: {
    width: cardWidth,
    marginBottom: theme.spacing.md,
  },
  artworkImage: {
    width: '100%',
    height: cardWidth * 1.09, // 세로가 더 긴 비율
    borderRadius: 0,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: '#E8E0D0',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  novelPreviewHome: {
    width: '100%',
    height: '100%',
    backgroundColor: 'white',
    padding: theme.spacing.sm,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  novelPreviewTextHome: {
    fontSize: 16,
    lineHeight: 22,
    color: theme.colors.text.primary,
    textAlign: 'center',
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif', 
      web: 'serif'
    }),
    fontWeight: '300',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 0.5,
  },
  searchContainer: {
    paddingHorizontal: 0,
    marginBottom: theme.spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E8E0D0',
    borderRadius: 12,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    ...theme.typography.body,
    color: theme.colors.text.primary,
  },
  artworkInfo: {
    marginTop: theme.spacing.sm,
  },
  artworkTitle: {
    ...theme.typography.body,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
    color: '#000000',
  },
  artworkAuthor: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginBottom: 2,
  },
  artworkCategory: {
    ...theme.typography.caption,
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
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
    marginBottom: theme.spacing.xl,
  },
  uploadButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
  },
  uploadButtonText: {
    ...theme.typography.body,
    color: 'white',
    fontWeight: '600',
  },
  filterBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  filterModal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  filterHandle: {
    width: 40,
    height: 4,
    backgroundColor: theme.colors.text.secondary,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: theme.spacing.md,
  },
  filterTitle: {
    ...theme.typography.body,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    marginBottom: theme.spacing.sm,
  },
  filterOptionActive: {
    backgroundColor: 'transparent',
  },
  filterOptionText: {
    ...theme.typography.body,
    color: theme.colors.text.primary,
  },
  filterOptionTextActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  headerInList: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 74,
    paddingBottom: theme.spacing.md,
  },
  categoryLoadingContainer: {
    paddingTop: 50,
    paddingBottom: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.sm,
  },
});

