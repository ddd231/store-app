import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../../styles/theme';

const ContestCard = React.memo(function ContestCard({ item, onPress }) {
  return (
    <TouchableOpacity 
      style={[styles.card, styles.contestCard]}
      onPress={() => onPress(item)}
      activeOpacity={1.0}
    >
      <Text style={[styles.cardTitle, styles.contestTitle]}>{item.title}</Text>
      
      <Text style={[styles.organizerName, styles.contestText]}>{item.organizer}</Text>
      <Text style={[styles.period, styles.contestText]}>{item.period}</Text>
      
      <Text style={[styles.description, styles.contestDescription]} numberOfLines={2}>
        {item.description}
      </Text>
      
      <View style={styles.cardFooter}>
        <Text style={[styles.prize, styles.contestPrize]}>{item.prize}</Text>
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
  contestCard: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
    marginLeft: 0,
    marginRight: theme.spacing.sm,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: theme.spacing.sm,
  },
  contestTitle: {
    fontSize: 13,
  },
  organizerName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  period: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  contestText: {
    fontSize: 11,
  },
  description: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    lineHeight: 18,
    marginBottom: theme.spacing.md,
  },
  contestDescription: {
    fontSize: 11,
    lineHeight: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prize: {
    ...theme.typography.body,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  contestPrize: {
    fontSize: 12,
  },
  spacer: {
    flex: 1,
  },
});

export default ContestCard;