import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../styles/theme';

const EmptyStates = React.memo(function EmptyStates({ selectedCategory, t }) {
  const getEmptyMessage = () => {
    switch (selectedCategory) {
      case 'blog':
        return t('noBlogs');
      case 'contest':
        return t('noContests');
      case 'recruit':
      default:
        return t('noJobPosts');
    }
  };

  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        {getEmptyMessage()}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
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
    textAlign: 'center',
  },
});

export default EmptyStates;