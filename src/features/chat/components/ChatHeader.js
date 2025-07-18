import React from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../styles/theme';
import { useLanguage } from '../../../contexts/LanguageContext';

const ChatHeader = React.memo(function ChatHeader({
  showSearchBar,
  searchQuery,
  setSearchQuery,
  onToggleSearch,
  onNewChat
}) {
  const { t } = useLanguage();

  return (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{t('chat')}</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.headerButton} onPress={onToggleSearch}>
            <Ionicons name="search" size={24} color="#000000" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={onNewChat}>
            <Ionicons name="add" size={24} color="#000000" />
          </TouchableOpacity>
        </View>
      </View>
      
      {showSearchBar && (
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={theme.colors.text.secondary} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('searchChats')}
              placeholderTextColor={theme.colors.text.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus={showSearchBar}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={function() { setSearchQuery(''); }}>
                <Ionicons name="close-circle" size={20} color={theme.colors.text.secondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  header: {
    backgroundColor: theme.colors.background,
    borderBottomWidth: 0,
    borderBottomColor: 'transparent',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 60,
    paddingBottom: theme.spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
  },
  headerButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    marginLeft: theme.spacing.md,
    padding: theme.spacing.sm,
  },
  searchContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
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
});

export default ChatHeader;