import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Dimensions, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../styles/theme';
import { supabase } from '../../../shared';

const { width } = Dimensions.get('window');
const galleryGap = 8;
const galleryPadding = galleryGap;
const galleryCardWidth = (width - (galleryPadding * 2) - (galleryGap * 2)) / 3;

const galleryStyles = {
  galleryContainer: {
    paddingTop: 0,
    paddingBottom: theme.spacing.lg,
    paddingHorizontal: galleryPadding,
  },
  galleriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -galleryGap/2,
  },
  galleryCard: {
    width: galleryCardWidth,
    marginHorizontal: galleryGap/2,
    marginBottom: galleryGap * 2,
    alignItems: 'center',
  },
  galleryThumbnail: {
    width: galleryCardWidth,
    height: galleryCardWidth,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  galleryName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: 2,
  },
  galleryWorkCount: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  novelThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#FEFCF8',
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  novelText: {
    fontSize: 11,
    color: theme.colors.text.primary,
    textAlign: 'center',
    lineHeight: 14,
  },
  novelTitle: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: 4,
    textAlign: 'center',
  },
  thumbnailGrid: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
  },
  thumbnailColumn: {
    flex: 1,
    flexDirection: 'column',
  },
  thumbnailHalf: {
    flex: 1,
    marginRight: 1,
  },
  thumbnailQuarter: {
    flex: 1,
    marginBottom: 1,
  },
};

function WorkThumbnail({ work }) {
  if (work.type === 'painting' && work.image_url) {
    return (
      <Image 
        source={{ uri: work.image_url }} 
        style={galleryStyles.galleryImage}
        resizeMode="cover"
      />
    );
  }
  
  if (work.type === 'novel' && work.content) {
    const contentPreview = work.content.slice(0, 80) + (work.content.length > 80 ? '...' : '');
    return (
      <View style={galleryStyles.novelThumbnail}>
        <Text style={galleryStyles.novelTitle} numberOfLines={1}>{work.title}</Text>
        <Text style={galleryStyles.novelText} numberOfLines={4}>{contentPreview}</Text>
      </View>
    );
  }
  
  return <Ionicons name="folder" size={32} color={theme.colors.primary} />;
}

function GalleryThumbnail({ workIds }) {
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(function() {
    async function loadWorkImages() {
      if (!workIds || !Array.isArray(workIds) || workIds.length === 0) {
        setLoading(false);
        return;
      }
      
      const validWorkIds = workIds.filter(id => id !== null && id !== undefined);
      
      if (validWorkIds.length === 0) {
        setLoading(false);
        return;
      }
      
      try {
        const { data: works, error } = await supabase
          .from('works')
          .select('id, image_url, type, title, content')
          .in('id', validWorkIds.slice(0, 4))
          .order('created_at', { ascending: false });
        
        if (!error && works) {
          const validWorks = works.filter(work => {
            if (!work) return false;
            if (work.type === 'painting') {
              return work.image_url && work.image_url.trim() !== '';
            } else if (work.type === 'novel') {
              return work.content && work.content.trim() !== '';
            }
            return false;
          });
          
          setWorks(validWorks);
        }
      } catch (error) {
        console.error('작품 이미지 로드 오류:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadWorkImages();
  }, [workIds]);

  if (loading) {
    return <Ionicons name="folder" size={32} color={theme.colors.primary} />;
  }

  if (works.length === 0) {
    return <Ionicons name="folder" size={32} color={theme.colors.primary} />;
  }

  if (works.length === 1) {
    return <WorkThumbnail work={works[0]} />;
  }

  if (works.length === 2) {
    return (
      <View style={galleryStyles.thumbnailGrid}>
        <View style={galleryStyles.thumbnailHalf}>
          <WorkThumbnail work={works[0]} />
        </View>
        <View style={galleryStyles.thumbnailHalf}>
          <WorkThumbnail work={works[1]} />
        </View>
      </View>
    );
  }

  if (works.length === 3) {
    return (
      <View style={galleryStyles.thumbnailGrid}>
        <View style={galleryStyles.thumbnailHalf}>
          <WorkThumbnail work={works[0]} />
        </View>
        <View style={galleryStyles.thumbnailColumn}>
          <View style={galleryStyles.thumbnailQuarter}>
            <WorkThumbnail work={works[1]} />
          </View>
          <View style={galleryStyles.thumbnailQuarter}>
            <WorkThumbnail work={works[2]} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={galleryStyles.thumbnailGrid}>
      <View style={galleryStyles.thumbnailColumn}>
        <View style={galleryStyles.thumbnailQuarter}>
          <WorkThumbnail work={works[0]} />
        </View>
        <View style={galleryStyles.thumbnailQuarter}>
          <WorkThumbnail work={works[1]} />
        </View>
      </View>
      <View style={galleryStyles.thumbnailColumn}>
        <View style={galleryStyles.thumbnailQuarter}>
          <WorkThumbnail work={works[2]} />
        </View>
        <View style={galleryStyles.thumbnailQuarter}>
          <WorkThumbnail work={works[3]} />
        </View>
      </View>
    </View>
  );
}

export default function ProfileGallery({ myGalleries, navigation, isOwnProfile }) {
  return (
    <View style={galleryStyles.galleryContainer}>
      <View style={galleryStyles.galleriesGrid}>
        {myGalleries.map(function(gallery) {
          return (
            <TouchableOpacity 
              key={gallery.id} 
              style={galleryStyles.galleryCard}
              onPress={function() { navigation.navigate('GalleryDetail', { galleryId: gallery.id }); }}
            >
              <View style={galleryStyles.galleryThumbnail}>
                <GalleryThumbnail workIds={gallery.work_ids} />
              </View>
              <Text style={galleryStyles.galleryName} numberOfLines={1}>{gallery.name}</Text>
              <Text style={galleryStyles.galleryWorkCount}>{gallery.work_ids?.length || 0}개 작품</Text>
            </TouchableOpacity>
          );
        })}
        
        {isOwnProfile && (
          <TouchableOpacity 
            style={galleryStyles.galleryCard}
            onPress={function() { navigation.navigate('CreateGallery'); }}
          >
            <View style={galleryStyles.galleryThumbnail}>
              <Ionicons name="add" size={32} color={theme.colors.text.secondary} />
            </View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}