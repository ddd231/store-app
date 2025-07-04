import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Alert,
  TextInput,
  Modal
} from 'react-native';
import { theme } from '../../../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { checkIsDeveloper, isAdminUser } from '../../../shared';
import { useAuth } from '../../auth/hooks/useAuth';

function ContestDetailScreen({ navigation, route }) {
  const { contest } = route.params;
  const { user } = useAuth();
  const [isDeveloper, setIsDeveloper] = useState(false);

  useEffect(function() {
    if (user) {
      setIsDeveloper(checkIsDeveloper(user));
    }
  }, [user]);

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={function() { navigation.goBack(); }}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>컨테스트</Text>
        {isDeveloper ? (
          <TouchableOpacity 
            onPress={function() { navigation.navigate('ContestEdit', { contestId: contest?.id }); }}
            style={styles.editButton}
          >
            <Ionicons name="pencil-outline" size={18} color={theme.colors.text.primary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerRight} />
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 기본 정보 */}
        <View style={styles.section}>
          <Text style={styles.title}>{contest.title}</Text>
          <Text style={styles.organizer}>{contest.organizer}</Text>
          <View style={styles.periodRow}>
            <Ionicons name="calendar-outline" size={16} color={theme.colors.text.secondary} />
            <Text style={styles.period}>{contest.period}</Text>
          </View>
        </View>

        {/* 상금 */}
        <View style={styles.prizeSection}>
          <View style={styles.prizeBox}>
            <Text style={styles.prizeLabel}>상금</Text>
            <Text style={styles.prizeAmount}>{contest.prize}</Text>
          </View>
        </View>

        {/* 설명 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>공모전 소개</Text>
          <Text style={styles.description}>{contest.description}</Text>
        </View>

        {/* 태그 */}
        {contest.tags && contest.tags.length > 0 && (
          <View style={styles.section}>
            <View style={styles.tagContainer}>
              {contest.tags.map(function(tag, index) {
                return (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>#{tag}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 60,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  headerRight: {
    width: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  organizer: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  period: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginLeft: 4,
  },
  prizeSection: {
    marginBottom: theme.spacing.xl,
  },
  prizeBox: {
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  prizeLabel: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  prizeAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: theme.colors.text.primary,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  tagText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  bottomSpace: {
    height: 50,
  },
});
export default ContestDetailScreen;
