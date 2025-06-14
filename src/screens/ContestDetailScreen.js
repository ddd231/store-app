import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Alert
} from 'react-native';
import { theme } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabaseClient';
import { checkIsDeveloper } from '../utils/permissions';

export default function ContestDetailScreen({ navigation, route }) {
  const { contest } = route.params;
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDeveloper, setIsDeveloper] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      
      if (user) {
        const isAdminUser = user.email === 'lsg5235@gmail.com' || user.user_metadata?.role === 'admin';
        setIsAdmin(isAdminUser);
        setIsDeveloper(checkIsDeveloper(user));
      }
    } catch (error) {
      console.error('관리자 상태 확인 오류:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>컨테스트</Text>
        {isDeveloper ? (
          <TouchableOpacity 
            onPress={() => navigation.navigate('ContestEdit', { contestId: contest?.id })}
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
              {contest.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.bottomSpace} />
      </ScrollView>
      
      {/* 관리자 업로드 버튼 */}
      {isAdmin && (
        <TouchableOpacity 
          style={styles.adminUploadButton}
          onPress={() => Alert.alert('업로드', '콘테스트 업로드 기능 준비 중입니다.')}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      )}
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
  adminUploadButton: {
    position: 'absolute',
    bottom: 120,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});