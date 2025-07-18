import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../styles/theme';
import { useLanguage } from '../../../contexts/LanguageContext';

const FriendItem = React.memo(function FriendItem({ friend, onPress }) {
  const { t } = useLanguage();
  
  return (
    <TouchableOpacity 
      style={styles.friendItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.friendInfo}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={24} color={theme.colors.text.secondary} />
        </View>
        <View style={styles.friendDetails}>
          <Text style={styles.friendName}>
            {friend.user_profiles.username || friend.user_profiles.email?.split('@')[0] || t('user')}
          </Text>
          <Text style={styles.friendSubtext}>
            {friend.user_profiles.short_intro || t('startChatting')}
          </Text>
        </View>
      </View>
      <Ionicons name="chatbubble-outline" size={20} color={theme.colors.primary} />
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  friendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.colors.border,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    ...theme.typography.body,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  friendSubtext: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
  },
});

export default FriendItem;