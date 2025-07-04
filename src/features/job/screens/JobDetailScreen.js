import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Alert,
  Linking
} from 'react-native';
import { theme } from '../../../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { getJobPost } from '../services/jobService';
import { supabase } from '../../../shared';
import { checkCanEdit } from '../../../shared';

function JobDetailScreen({ navigation, route }) {
  const { jobId } = route.params;
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [canEdit, setCanEdit] = useState(false);

  useEffect(function() {
    loadJobDetail();
  }, [jobId]);

  useEffect(function() {
    if (job) {
      checkEditPermission();
    }
  }, [job]);

  async function loadJobDetail() {
    try {
      setLoading(true);
      const data = await getJobPost(jobId);
      setJob(data);
    } catch (error) {
      console.error('채용공고 상세 조회 오류:', error);
      Alert.alert('오류', '채용공고를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  async function checkEditPermission() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && job) {
        setCanEdit(checkCanEdit(user, job.user_id));
      }
    } catch (error) {
      console.error('편집 권한 확인 오류:', error);
    }
  };

  function handleApply() {
    if (job?.contact_email) {
      const subject = encodeURIComponent(`[지원] ${job.title}`);
      const mailtoUrl = `mailto:${job.contact_email}?subject=${subject}`;
      Linking.openURL(mailtoUrl).catch(function(err) {
        Alert.alert('오류', '이메일 앱을 열 수 없습니다.');
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>로딩 중...</Text>
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.errorContainer}>
        <Text>채용공고를 찾을 수 없습니다.</Text>
      </View>
    );
  }

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
        <Text style={styles.headerTitle}>채용공고</Text>
        {canEdit ? (
          <TouchableOpacity 
            onPress={function() { navigation.navigate('JobEdit', { jobId: job.id }); }}
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
          <Text style={styles.title}>{job.title}</Text>
          <Text style={styles.company}>{job.company}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={16} color={theme.colors.text.secondary} />
            <Text style={styles.location}>{job.location}</Text>
          </View>
        </View>

        {/* 채용 내용 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>채용 내용</Text>
          <Text style={styles.description}>{job.description}</Text>
        </View>

        {/* 지원 자격 요건 */}
        {job.requirements && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>지원 자격 요건</Text>
            <Text style={styles.description}>{job.requirements}</Text>
          </View>
        )}

        {/* 복리후생 및 우대사항 */}
        {job.benefits && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>복리후생 및 우대사항</Text>
            <Text style={styles.description}>{job.benefits}</Text>
          </View>
        )}

        {/* 태그 */}
        {job.tags && job.tags.length > 0 && (
          <View style={styles.section}>
            <View style={styles.tagContainer}>
              {job.tags.map(function(tag, index) {
                return (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>#{tag}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* 작성일 */}
        <View style={styles.section}>
          <Text style={styles.dateText}>
            등록일: {new Date(job.created_at).toLocaleDateString('ko-KR')}
          </Text>
        </View>

        {/* 지원하기 버튼 */}
        <TouchableOpacity 
          style={styles.applyButton}
          onPress={handleApply}
        >
          <Text style={styles.applyButtonText}>지원하기</Text>
        </TouchableOpacity>

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  company: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginLeft: 4,
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
  dateText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  applyButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
  },
  applyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpace: {
    height: 50,
  },
});
export default JobDetailScreen;
