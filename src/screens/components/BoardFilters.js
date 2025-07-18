import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { theme } from '../../styles/theme';

const BoardFilters = React.memo(function BoardFilters({ contestFilter, onFilterChange, t }) {
  const filters = [
    { id: 'all', label: t('all') },
    { id: 'ongoing', label: t('ongoing') },
    { id: 'ended', label: t('ended') },
    { id: 'upcoming', label: t('upcoming') }
  ];

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.filterContainer}
    >
      {filters.map(function(filter) {
        return (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterButton,
              contestFilter === filter.id && styles.filterButtonActive
            ]}
            onPress={() => onFilterChange(filter.id)}
          >
            <Text style={[
              styles.filterText,
              contestFilter === filter.id && styles.filterTextActive
            ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  filterContainer: {
    flexDirection: 'row',
    marginRight: theme.spacing.sm,
  },
  filterButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    marginRight: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  filterTextActive: {
    color: 'white',
  },
});

export default BoardFilters;