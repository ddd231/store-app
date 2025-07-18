import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../../styles/theme';

const RecruitCard = React.memo(function RecruitCard({ item, onPress }) {
  return (
    <TouchableOpacity 
      style={[styles.card, styles.recruitCard]}
      onPress={() => onPress(item.id)}
      activeOpacity={1.0}
    >
      <Text style={styles.cardTitle}>{item.title}</Text>
      
      <Text style={styles.companyName}>{item.company}</Text>
      <Text style={styles.location}>{item.location}</Text>
      
      <Text style={styles.description} numberOfLines={3}>
        {item.description}
      </Text>
      
      <View style={styles.cardFooter}>
        <View style={styles.spacer} />
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
  recruitCard: {
    padding: theme.spacing.md,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: theme.spacing.sm,
  },
  companyName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  location: {
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
  spacer: {
    flex: 1,
  },
});

export default RecruitCard;