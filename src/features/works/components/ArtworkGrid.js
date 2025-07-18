import React, { useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Dimensions, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../styles/theme';
import { OptimizedImage } from '../../../shared';

const { width } = Dimensions.get('window');
const cardWidth = (width - 16 * 2 - theme.spacing.md) / 2;

const ArtworkCard = React.memo(function ArtworkCard({ item, onPress }) {
  return (
    <TouchableOpacity
      style={styles.artworkCard}
      onPress={onPress}
      activeOpacity={1.0}
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
      
      <View style={styles.cardContent}>
        <Text style={styles.artworkTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.artworkAuthor} numberOfLines={1}>
          by {item.author_name || item.author || '익명'}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

const ArtworkGrid = React.memo(function ArtworkGrid({ 
  artworks, 
  navigation, 
  refreshing, 
  onRefresh,
  categoryLoading 
}) {
  const renderArtworkItem = useCallback(function({ item }) {
    return (
      <ArtworkCard 
        item={item}
        onPress={function() { 
          navigation.navigate('WorkDetail', { workId: item.id, work: item }); 
        }}
      />
    );
  }, [navigation]);

  const keyExtractor = useCallback(function(item, index) {
    return item?.id?.toString() || index.toString();
  }, []);

  if (categoryLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>카테고리 로딩 중...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={artworks}
      renderItem={renderArtworkItem}
      keyExtractor={keyExtractor}
      numColumns={2}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.gridContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      windowSize={10}
      initialNumToRender={8}
    />
  );
});

const styles = StyleSheet.create({
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
    height: cardWidth * 1.05,
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
  novelPreviewHome: {
    flex: 1,
    padding: theme.spacing.sm,
    backgroundColor: '#FEFCF8',
    justifyContent: 'flex-start',
  },
  novelPreviewTextHome: {
    ...theme.typography.caption,
    fontSize: 13,
    lineHeight: 18,
    color: '#444444',
    textAlign: 'left',
  },
  placeholderImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  cardContent: {
    paddingTop: theme.spacing.xs,
    paddingHorizontal: 2,
  },
  artworkTitle: {
    ...theme.typography.caption,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
    fontSize: 13,
  },
  artworkAuthor: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    fontSize: 11,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.md,
  },
});

export default ArtworkGrid;