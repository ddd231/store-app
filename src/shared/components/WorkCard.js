import React, { memo } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';

const { width } = Dimensions.get('window');
const cardWidth = (width - theme.spacing.lg * 2 - theme.spacing.md) / 2;

const WorkCard = memo(function({ work, onPress }) {
  function renderContent() {
    if (work.type === 'novel' && work.content) {
      return (
        <View style={styles.novelPreview}>
          <Text style={styles.novelPreviewText} numberOfLines={7}>
            {work.content}
          </Text>
        </View>
      );
    }

    if (work.image_url) {
      return (
        <Image 
          source={{ uri: work.image_url }} 
          style={styles.workImage}
          resizeMode="cover"
        />
      );
    }

    return (
      <View style={styles.workPlaceholder}>
        <Ionicons 
          name={work.type === 'painting' ? 'color-palette-outline' : 'book-outline'} 
          size={40} 
          color={theme.colors.text.secondary} 
        />
      </View>
    );
  };

  return (
    <TouchableOpacity style={styles.workCard} onPress={function() { onPress(work); }}>
      {renderContent()}
      <Text style={styles.workTitle} numberOfLines={2}>
        {work.title}
      </Text>
      <Text style={styles.workCategory} numberOfLines={1}>
        {work.category}
      </Text>
    </TouchableOpacity>
  );
});

WorkCard.displayName = 'WorkCard';

const styles = StyleSheet.create({
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
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
  },
  novelPreview: {
    width: '100%',
    height: cardWidth * 1.2,
    borderRadius: theme.borderRadius.medium,
    backgroundColor: 'white',
    padding: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
    overflow: 'hidden',
  },
  novelPreviewText: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.text.primary,
    textAlign: 'left',
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
  },
  workTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  workCategory: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
});

export default WorkCard;