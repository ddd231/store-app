import React from 'react';
import { TouchableOpacity, Image, View, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../styles/theme';
import { profileStyles } from '../styles/ProfileStyles';

export default function ProfilePortfolio({ item, navigation }) {
  if (!item || typeof item !== 'object') {
    return null;
  }
  
  return (
    <TouchableOpacity 
      style={profileStyles.workCard}
      onPress={function() { navigation.navigate('WorkDetail', { workId: item.id, work: item }); }}
    >
      {item.type === 'novel' && item.content ? (
        <View style={profileStyles.novelPreview}>
          <Text style={profileStyles.novelPreviewText} numberOfLines={7}>
            {item.content || '내용 없음'}
          </Text>
        </View>
      ) : item.image_url ? (
        <Image source={{ uri: item.image_url }} style={profileStyles.workImage} />
      ) : (
        <View style={profileStyles.workPlaceholder}>
          <Ionicons 
            name={item.type === 'painting' ? 'color-palette-outline' : 'book-outline'} 
            size={50} 
            color={theme.colors.text.secondary} 
          />
        </View>
      )}
      <Text style={profileStyles.workTitle} numberOfLines={1} ellipsizeMode="tail">
        {item.title || '제목 없음'}
      </Text>
      <Text style={profileStyles.workCategory} numberOfLines={1} ellipsizeMode="tail">
        {item.category || '카테고리 없음'}
      </Text>
    </TouchableOpacity>
  );
}