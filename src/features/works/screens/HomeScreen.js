import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../styles/theme';
import { useLanguage } from '../../../contexts/LanguageContext';
import HomeMenu from '../../../components/HomeMenu';
import { useHomeData } from '../hooks/useHomeData';
import { useHomeSearch } from '../hooks/useHomeSearch';
import { useHomeAnimations } from '../hooks/useHomeAnimations';
import CategoryTabs from '../components/CategoryTabs';
import SearchBar from '../components/SearchBar';
import ArtworkGrid from '../components/ArtworkGrid';
import FilterModal from '../components/FilterModal';
import { BottomBannerAd } from '../../../shared';

export default function HomeScreen({ navigation }) {
  const { t } = useLanguage();
  const [menuVisible, setMenuVisible] = useState(false);

  // Custom hooks
  const {
    artworks,
    loading,
    categoryLoading,
    refreshing,
    selectedCategory,
    onRefresh,
    changeCategory
  } = useHomeData();

  const {
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    sortedArtworks
  } = useHomeSearch(artworks);

  const {
    filterVisible,
    modalSlideAnim,
    backdropOpacityAnim,
    openModal,
    closeModal
  } = useHomeAnimations();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>{t('loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>ARLD</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={function() { setMenuVisible(true); }}
          >
            <Ionicons name="menu" size={28} color="#000000" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <SearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onFilterPress={null}
      />

      {/* Category Tabs with Filter */}
      <View style={styles.categoryTabsWrapper}>
        <CategoryTabs
          selectedCategory={selectedCategory}
          onCategoryChange={changeCategory}
          categoryLoading={categoryLoading}
        />
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={openModal}
        >
          <Ionicons 
            name="options-outline" 
            size={24} 
            color={theme.colors.text.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Artwork Grid */}
      <ArtworkGrid
        artworks={sortedArtworks}
        navigation={navigation}
        refreshing={refreshing}
        onRefresh={onRefresh}
        categoryLoading={categoryLoading}
      />

      {/* Filter Modal */}
      <FilterModal
        visible={filterVisible}
        sortBy={sortBy}
        setSortBy={setSortBy}
        modalSlideAnim={modalSlideAnim}
        backdropOpacityAnim={backdropOpacityAnim}
        onClose={closeModal}
      />

      {/* Home Menu */}
      <HomeMenu
        visible={menuVisible}
        onClose={function() { setMenuVisible(false); }}
        navigation={navigation}
      />

      {/* Bottom Banner Ad */}
      <BottomBannerAd />
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
  loadingText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 50,
    paddingBottom: theme.spacing.md,
  },
  headerLeft: {
    flex: 1,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#000000',
    letterSpacing: -1,
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
    transform: [{ translateY: 5 }],
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  menuButton: {
    padding: theme.spacing.sm,
    transform: [{ translateY: 5 }],
  },
  categoryTabsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.sm,
  },
  filterButton: {
    padding: theme.spacing.sm,
    backgroundColor: 'transparent',
    borderRadius: theme.borderRadius.small,
  },
});