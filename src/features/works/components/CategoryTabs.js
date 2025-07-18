import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { theme } from '../../../styles/theme';
import { useLanguage } from '../../../contexts/LanguageContext';

const CategoryTabs = React.memo(function CategoryTabs({ 
  selectedCategory, 
  onCategoryChange, 
  categoryLoading 
}) {
  const { t } = useLanguage();

  const categories = [
    { id: 'all', name: t('allCategories') },
    { id: 'novel', name: t('novelCategory') },
    { id: 'painting', name: t('paintingCategory') },
  ];

  return (
    <View style={styles.categoryContainer}>
      {categories.map(function(category) {
        return (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              selectedCategory === category.id && styles.categoryButtonActive
            ]}
            onPress={function() { onCategoryChange(category.id); }}
            disabled={categoryLoading}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === category.id && styles.categoryTextActive
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  categoryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 0,
    marginBottom: 0,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  categoryButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginRight: theme.spacing.sm,
    borderRadius: 0,
    backgroundColor: 'transparent',
  },
  categoryButtonActive: {
    backgroundColor: 'transparent',
  },
  categoryText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
});

export default CategoryTabs;