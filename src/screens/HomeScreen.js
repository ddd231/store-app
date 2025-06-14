import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Dimensions, Platform, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import { theme } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import HomeMenu from '../components/HomeMenu';
import { getWorks } from '../services/workService';

const { width } = Dimensions.get('window');
const cardWidth = (width - theme.spacing.lg * 2 - theme.spacing.md) / 2;

export default function HomeScreen({ navigation }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [menuVisible, setMenuVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [sortBy, setSortBy] = useState('latest'); // latest, oldest, random
  
  const categories = [
    { id: 'all', name: '전체' },
    { id: 'novel', name: '소설' },
    { id: 'painting', name: '그림' },
  ];

  // 작품 데이터 로드
  const loadWorks = async () => {
    try {
      const data = await getWorks(selectedCategory);
      setArtworks(data);
    } catch (error) {
      console.error('작품 로드 오류:', error);
      // 오류 시 빈 배열로 설정
      setArtworks([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 카테고리 변경 시 데이터 다시 로드
  useEffect(() => {
    setLoading(true);
    loadWorks();
  }, [selectedCategory]);

  // 당겨서 새로고침
  const onRefresh = () => {
    setRefreshing(true);
    loadWorks();
  };

  // 검색 필터링 및 정렬 (메모이제이션)
  const filteredAndSortedArtworks = useMemo(() => {
    let filtered = artworks;
    
    // 검색 필터링
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = artworks.filter(work => 
        work.title.toLowerCase().includes(query) ||
        work.description?.toLowerCase().includes(query) ||
        work.category?.toLowerCase().includes(query)
      );
    }
    
    // 정렬
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'latest':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'oldest':
          return new Date(a.created_at) - new Date(b.created_at);
        case 'random':
          // 안정적인 랜덤 정렬을 위해 ID 기반 해싱 사용
          return (a.id || '').localeCompare(b.id || '') * (Math.random() > 0.5 ? 1 : -1);
        default:
          return 0;
      }
    });
  }, [artworks, searchQuery, sortBy]);

  const renderArtworkItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.artworkCard}
      onPress={() => navigation.navigate('WorkDetail', { workId: item.id, work: item })}
    >
      <View style={styles.artworkImage}>
        {item.type === 'novel' && item.content ? (
          <View style={styles.novelPreviewHome}>
            <Text style={styles.novelPreviewTextHome} numberOfLines={8}>
              {item.content}
            </Text>
          </View>
        ) : item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.image} />
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
        <Text style={styles.artworkAuthor} numberOfLines={1}>{item.author_name}</Text>
        <Text style={styles.artworkCategory} numberOfLines={1}>{item.category}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <View style={{ width: 44 }} />
        <Text style={styles.title}>ARLD</Text>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => setMenuVisible(true)}
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
            placeholder="작품 검색..."
            placeholderTextColor={theme.colors.text.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            maxLength={100}
          />
        </View>
      </View>

      {/* 카테고리 필터 */}
      <View style={styles.categoryContainer}>
        {categories.map(category => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              selectedCategory === category.id && styles.categoryButtonActive
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Text style={[
              styles.categoryText,
              selectedCategory === category.id && styles.categoryTextActive
            ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
        
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setFilterVisible(true)}
        >
          <Ionicons name="filter" size={20} color={theme.colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* 작품 그리드 */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredAndSortedArtworks}
          renderItem={renderArtworkItem}
          keyExtractor={item => item.id}
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
          ListEmptyComponent={null}
        />
      )}

      {/* 메뉴 */}
      <HomeMenu 
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        navigation={navigation}
      />

      {/* 필터 팝업 */}
      {filterVisible && (
        <TouchableOpacity 
          style={styles.filterBackdrop} 
          activeOpacity={1} 
          onPress={() => setFilterVisible(false)}
        >
          <View style={styles.filterPopup}>
            <TouchableOpacity
              style={[styles.filterOption, sortBy === 'latest' && styles.filterOptionActive]}
              onPress={() => {
                setSortBy('latest');
                setFilterVisible(false);
              }}
            >
              <Text style={[styles.filterOptionText, sortBy === 'latest' && styles.filterOptionTextActive]}>
                최신순
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterOption, sortBy === 'oldest' && styles.filterOptionActive]}
              onPress={() => {
                setSortBy('oldest');
                setFilterVisible(false);
              }}
            >
              <Text style={[styles.filterOptionText, sortBy === 'oldest' && styles.filterOptionTextActive]}>
                오래된순
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterOption, sortBy === 'random' && styles.filterOptionActive]}
              onPress={() => {
                setSortBy('random');
                setFilterVisible(false);
              }}
            >
              <Text style={[styles.filterOptionText, sortBy === 'random' && styles.filterOptionTextActive]}>
                랜덤
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
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
  },
  menuButton: {
    padding: theme.spacing.sm,
  },
  categoryContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    alignItems: 'center',
  },
  categoryButton: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    marginRight: theme.spacing.md,
    borderRadius: 0,
    backgroundColor: 'transparent',
  },
  categoryButtonActive: {
    backgroundColor: 'transparent',
    borderBottomWidth: 2,
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
    marginLeft: 'auto',
    padding: theme.spacing.sm,
    backgroundColor: 'transparent',
    borderRadius: theme.borderRadius.small,
  },
  gridContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 100,
  },
  row: {
    justifyContent: 'space-between',
  },
  artworkCard: {
    width: cardWidth,
    marginBottom: theme.spacing.lg,
  },
  artworkImage: {
    width: '100%',
    height: cardWidth * 1.2, // 세로가 더 긴 비율
    borderRadius: theme.borderRadius.medium,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
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
  },
  novelPreviewTextHome: {
    fontSize: 16,
    lineHeight: 22,
    color: theme.colors.text.primary,
    textAlign: 'left',
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
  },
  searchContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.medium,
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
    fontWeight: '600',
    marginBottom: 2,
  },
  artworkAuthor: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginBottom: 2,
  },
  artworkCategory: {
    ...theme.typography.caption,
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  filterPopup: {
    position: 'absolute',
    top: 250, // 필터 버튼 아래로 더 내림
    right: theme.spacing.lg,
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.medium,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    minWidth: 120,
  },
  filterOption: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  filterOptionActive: {
    backgroundColor: `${theme.colors.primary}10`,
  },
  filterOptionText: {
    ...theme.typography.body,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  filterOptionTextActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
});