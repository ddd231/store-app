import React, { useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { theme } from '../../../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { ErrorBoundary } from '../../../shared';
import FriendItem from '../components/FriendItem';
import { useSelectFriend } from '../hooks/useSelectFriend';
import { useLanguage } from '../../../contexts/LanguageContext';

export default function SelectFriendForChatScreen({ navigation }) {
  const { t } = useLanguage();
  const {
    friends,
    loading,
    searchQuery,
    setSearchQuery,
    startChatWithFriend
  } = useSelectFriend();

  const handleFriendPress = useCallback(function(friend) {
    startChatWithFriend(friend, navigation);
  }, [startChatWithFriend, navigation]);

  const renderFriendItem = useCallback(function({ item }) {
    return (
      <FriendItem
        friend={item}
        onPress={function() { handleFriendPress(item); }}
      />
    );
  }, [handleFriendPress]);

  const keyExtractor = useCallback(function(item) { 
    return item.id; 
  }, []);

  const renderEmptyComponent = useCallback(function() {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons 
          name="people-outline" 
          size={60} 
          color={theme.colors.text.secondary} 
        />
        <Text style={styles.emptyText}>
          {searchQuery ? t('noSearchResults') : t('noFriendsToChat')}
        </Text>
        <Text style={styles.emptySubtext}>
          {t('addFriendsFirst')}
        </Text>
      </View>
    );
  }, [searchQuery, t]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ErrorBoundary name="SelectFriendForChatScreen">
      <View style={styles.container}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={function() { navigation.goBack(); }}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>{t('newChat')}</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* 검색창 */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={theme.colors.text.secondary} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('searchFriend')}
              placeholderTextColor={theme.colors.text.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* 친구 목록 */}
        <FlatList
          data={friends}
          renderItem={renderFriendItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmptyComponent}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          windowSize={21}
          initialNumToRender={15}
        />
      </View>
    </ErrorBoundary>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 60,
    paddingBottom: theme.spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  searchContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
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
  listContainer: {
    paddingBottom: theme.spacing.xl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: theme.spacing.lg,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.md,
    textAlign: 'center',
    fontWeight: '600',
  },
  emptySubtext: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
});