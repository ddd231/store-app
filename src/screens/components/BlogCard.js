import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../../styles/theme';

const BlogCard = React.memo(function BlogCard({ item, onPress }) {
  return (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => onPress(item)}
      activeOpacity={1.0}
    >
      <Text style={styles.cardTitle}>{item.title}</Text>
      
      <Text style={styles.authorName}>{item.author}</Text>
      <Text style={styles.dateInfo}>{item.date}</Text>
      
      <Text style={styles.description} numberOfLines={3}>
        {item.description}
      </Text>
      
      <View style={styles.cardFooter}>
        <View style={styles.tagContainer}>
          {item.tags.map(function(tag, index) { 
            return (
              <Text key={index} style={styles.tag}>#{tag}</Text>
            );
          })}
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 0,
    padding: theme.spacing.lg,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: theme.spacing.sm,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  dateInfo: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  description: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    lineHeight: 18,
    marginBottom: theme.spacing.md,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tagContainer: {
    flexDirection: 'row',
    flex: 1,
    flexWrap: 'wrap',
  },
  tag: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginRight: theme.spacing.sm,
  },
});

export default BlogCard;