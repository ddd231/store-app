import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../../styles/theme';

const BoardTabs = React.memo(function BoardTabs({ categories, selectedCategory, onCategoryChange }) {
  return (
    <View style={styles.tabContainer}>
      {categories.map(function(category) { 
        return (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.tabButton,
              selectedCategory === category.id && styles.tabButtonActive
            ]}
            onPress={() => onCategoryChange(category.id)}
          >
            <Text style={[
              styles.tabText,
              selectedCategory === category.id && styles.tabTextActive
            ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: theme.spacing.lg,
    marginTop: 60, // 상태바 높이만큼 여백 추가
    marginBottom: theme.spacing.lg,
  },
  tabButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    borderRadius: theme.borderRadius.small,
    backgroundColor: 'transparent', // 기본적으로 투명 배경
  },
  tabButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  tabText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: 'white',
    fontWeight: '600',
  },
});

export default BoardTabs;