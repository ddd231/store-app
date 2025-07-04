import React from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../styles/theme';

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
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
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
};

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
                <Ionicons name="folder" size={32} color={theme.colors.primary} />
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
            <View style={[galleryStyles.galleryThumbnail, { borderStyle: 'dashed', borderWidth: 2 }]}>
              <Ionicons name="add" size={32} color={theme.colors.text.secondary} />
            </View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}