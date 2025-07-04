import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, RefreshControl, Platform, Alert } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS } from 'react-native-reanimated';
import { theme } from '../styles/theme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { getJobPosts } from '../features/job';
import { getBlogPosts } from '../features/blog';
import { getContests } from '../features/contest';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase, isAdminUser, checkPremiumOrAdminAccess } from '../shared';
import { useAuth } from '../features/auth';
// AdMob 모듈을 조건부로 import
let BannerAd, BannerAdSize, TestIds;
try {
  const AdMob = require('react-native-google-mobile-ads');
  BannerAd = AdMob.BannerAd;
  BannerAdSize = AdMob.BannerAdSize;
  TestIds = AdMob.TestIds;
} catch (error) {
  logger.log('AdMob not available in Expo Go');
}

// AdMob 광고 단위 ID
const adUnitId = Platform.select({
  ios: 'ca-app-pub-3406933300576517/2235875933',
  android: 'ca-app-pub-3406933300576517/2235875933',
});

export default function BoardScreen({ navigation }) {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('recruit');
  const [jobPosts, setJobPosts] = useState([]);
  const [blogPosts, setBlogPosts] = useState([]);
  const [contests, setContests] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [contestFilter, setContestFilter] = useState('all'); // 'all', 'ongoing', 'ended', 'upcoming'
  const [isAdmin, setIsAdmin] = useState(false);
  
  const { t } = useLanguage();
  
  const categories = [
    { id: 'contest', name: t('contestCategory') },
    { id: 'blog', name: t('blogCategory') },
    { id: 'recruit', name: '채용 · 협업' },
  ];

  // 채용공고 데이터 로드
  async function loadJobPosts() {
    try {
      setLoading(true);
      const data = await getJobPosts();
      setJobPosts(data);
    } catch (error) {
      console.error('채용공고 로딩 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 블로그 데이터 로드
  async function loadBlogPosts() {
    try {
      setLoading(true);
      const data = await getBlogPosts();
      setBlogPosts(data);
    } catch (error) {
      console.error('블로그 로딩 오류:', error);
      setBlogPosts([]); // 에러 시 빈 배열
    } finally {
      setLoading(false);
    }
  };

  // 컨테스트 데이터 로드
  async function loadContests() {
    try {
      setLoading(true);
      const data = await getContests();
      setContests(data);
    } catch (error) {
      console.error('컨테스트 로딩 오류:', error);
      setContests([]); // 에러 시 빈 배열
    } finally {
      setLoading(false);
    }
  };

  // 카테고리별 데이터 로드
  async function loadDataForCategory(category) {
    switch (category) {
      case 'recruit':
        await loadJobPosts();
        break;
      case 'blog':
        await loadBlogPosts();
        break;
      case 'contest':
        await loadContests();
        break;
      default:
        break;
    }
  };

  // 새로고침
  async function onRefresh() {
    setIsRefreshing(true);
    await loadDataForCategory(selectedCategory);
    setIsRefreshing(false);
  };


  // 관리자 체크
  useEffect(function() {
    if (user) {
      setIsAdmin(isAdminUser(user));
    }
  }, [user]);

  // 컴포넌트 마운트 시 초기 데이터 로드
  useEffect(function() {
    loadDataForCategory(selectedCategory);
  }, []);

  // 카테고리 변경 시 데이터 로드
  useEffect(function() {
    loadDataForCategory(selectedCategory);
  }, [selectedCategory]);

  // 탭 포커스 시 데이터 새로고침
  useEffect(function() {
    const unsubscribe = navigation.addListener('focus', function() {
      loadDataForCategory(selectedCategory);
    });

    return unsubscribe;
  }, [navigation, selectedCategory]);

  // 컨테스트 필터링 함수
  function filterContests(contests) {
    const now = new Date();
    
    return contests.filter(function(contest) {
      const startDate = new Date(contest.start_date);
      const endDate = new Date(contest.end_date);
      
      switch (contestFilter) {
        case 'ongoing':
          return startDate <= now && endDate >= now;
        case 'ended':
          return endDate < now;
        case 'upcoming':
          return startDate > now;
        case 'all':
        default:
          return true;
      }
    });
  };

  // 카테고리별 데이터 필터링
  function getFilteredData() {
    switch (selectedCategory) {
      case 'recruit':
        // 실제 채용공고 데이터를 변환하여 반환
        return jobPosts.map(function(job) { return ({
          id: job.id,
          title: job.title,
          company: job.company,
          location: job.location,
          description: job.description,
          type: 'recruit',
          tags: job.tags || [],
          contactEmail: job.contact_email,
          requirements: job.requirements,
          benefits: job.benefits,
          createdAt: job.created_at
        }); });
      case 'blog':
        // 실제 블로그 데이터를 변환하여 반환
        return blogPosts.map(function(blog) { return ({
          id: blog.id,
          title: blog.title,
          author: blog.author_name,
          date: new Date(blog.created_at).toLocaleDateString('ko-KR'),
          readTime: `${blog.read_time}분`,
          description: blog.excerpt || blog.content.substring(0, 100) + '...',
          type: 'blog',
          tags: blog.tags || [],
          content: blog.content,
          createdAt: blog.created_at
        }); });
      case 'contest':
        // 실제 컨테스트 데이터를 필터링하고 변환하여 반환
        const filteredContests = filterContests(contests);
        return filteredContests.map(function(contest) { return ({
          id: contest.id,
          title: contest.title,
          organizer: contest.organizer,
          period: `${new Date(contest.start_date).toLocaleDateString('ko-KR')} ~ ${new Date(contest.end_date).toLocaleDateString('ko-KR')}`,
          prize: contest.prize,
          description: contest.description,
          type: 'contest',
          tags: contest.tags || [],
          startDate: contest.start_date,
          endDate: contest.end_date,
          requirements: contest.requirements,
          submissionGuidelines: contest.submission_guidelines,
          contactEmail: contest.contact_email,
          createdAt: contest.created_at
        }); });
      default:
        return [];
    }
  };

  const filteredData = getFilteredData();


  function renderItem({ item }) {
    if (item.type === 'recruit') {
      return (
        <TouchableOpacity 
          style={[styles.card, styles.recruitCard]}
          onPress={function() { navigation.navigate('JobDetail', { jobId: item.id }); }}
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
    } else if (item.type === 'contest') {
      return (
        <TouchableOpacity 
          style={[styles.card, styles.contestCard]}
          onPress={function() { navigation.navigate('ContestDetail', { contest: item }); }}
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
    } else if (item.type === 'blog') {
      return (
        <TouchableOpacity 
          style={styles.card}
          onPress={function() { navigation.navigate('BlogDetail', { blog: item }); }}
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
              {item.tags.map(function(tag, index) { return (
                <Text key={index} style={styles.tag}>#{tag}</Text>
              );})}
            </View>
          </View>
        </TouchableOpacity>
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* 카테고리 탭 */}
      <View style={styles.tabContainer}>
        {categories.map(function(category) { return (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.tabButton,
              selectedCategory === category.id && styles.tabButtonActive
            ]}
            onPress={function() { setSelectedCategory(category.id); }}
          >
            <Text style={[
              styles.tabText,
              selectedCategory === category.id && styles.tabTextActive
            ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ); })}
      </View>

      {/* 업로드/작성 버튼 */}
      <View style={styles.sectionHeader}>
        {selectedCategory === 'recruit' && (
          <Text style={styles.sectionTitle}>{t('jobPostsList')}</Text>
        )}
        {selectedCategory === 'blog' && (
          <Text style={styles.sectionTitle}>{t('blog')}</Text>
        )}
        {selectedCategory === 'contest' && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.filterContainer}
          >
            <TouchableOpacity
              style={[
                styles.filterButton,
                contestFilter === 'all' && styles.filterButtonActive
              ]}
              onPress={function() { setContestFilter('all'); }}
            >
              <Text style={[
                styles.filterText,
                contestFilter === 'all' && styles.filterTextActive
              ]}>{t('all')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                contestFilter === 'ongoing' && styles.filterButtonActive
              ]}
              onPress={function() { setContestFilter('ongoing'); }}
            >
              <Text style={[
                styles.filterText,
                contestFilter === 'ongoing' && styles.filterTextActive
              ]}>{t('ongoing')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                contestFilter === 'ended' && styles.filterButtonActive
              ]}
              onPress={function() { setContestFilter('ended'); }}
            >
              <Text style={[
                styles.filterText,
                contestFilter === 'ended' && styles.filterTextActive
              ]}>{t('ended')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                contestFilter === 'upcoming' && styles.filterButtonActive
              ]}
              onPress={function() { setContestFilter('upcoming'); }}
            >
              <Text style={[
                styles.filterText,
                contestFilter === 'upcoming' && styles.filterTextActive
              ]}>{t('upcoming')}</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
        <View style={styles.spacer} />
        {selectedCategory === 'recruit' && (
          <TouchableOpacity 
            style={styles.postJobButton}
            onPress={function() {
              if (!user) {
                navigation.navigate('Login');
                return;
              }

              if (!checkPremiumOrAdminAccess(user)) {
                navigation.navigate('Upgrade');
                return;
              }

              navigation.navigate('JobPost');
            }}
          >
            <Text style={styles.postJobButtonText}>{t('postJob')}</Text>
          </TouchableOpacity>
        )}
        {selectedCategory === 'blog' && isAdmin && (
          <TouchableOpacity 
            style={styles.postJobButton}
            onPress={function() { navigation.navigate('BlogEdit'); }}
          >
            <Text style={styles.postJobButtonText}>{t('writeBlog')}</Text>
          </TouchableOpacity>
        )}
        {selectedCategory === 'contest' && (
          <TouchableOpacity 
            style={styles.plusButton}
            onPress={function() {
              if (!user) {
                navigation.navigate('Login');
                return;
              }

              if (!checkPremiumOrAdminAccess(user)) {
                navigation.navigate('Upgrade');
                return;
              }

              navigation.navigate('ContestEdit');
            }}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        )}
      </View>

      {/* 컨텐츠 리스트 */}
      {selectedCategory === 'contest' ? (
        <FlatList
          key="contest-grid"
          data={filteredData}
          renderItem={renderItem}
          keyExtractor={function(item) { return item.id.toString(); }}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t('noContests')}</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          key="single-column"
          data={filteredData}
          renderItem={renderItem}
          keyExtractor={function(item) { return item.id.toString(); }}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {selectedCategory === 'blog' ? t('noBlogs') : t('noJobPosts')}
              </Text>
            </View>
          }
        />
      )}
      
      {/* 하단 배너 광고 - AdMob이 사용 가능한 경우에만 표시 */}
      {BannerAd && adUnitId && (
        <View style={styles.adContainer}>
          <BannerAd
            unitId={adUnitId}
            size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
            onAdLoaded={function() {
              logger.log('광고 로드 완료');
            }}
            onAdFailedToLoad={function(error) {
              console.error('광고 로드 실패:', error);
            }}
          />
        </View>
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
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 60,
    paddingBottom: theme.spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    ...theme.typography.body,
    fontWeight: 'bold',
  },
  postJobButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
  postJobButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 160, // 광고 공간 확보를 위해 증가
  },
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: theme.spacing.sm,
  },
  bookmarkButton: {
    padding: 4,
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
  jobDescription: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  salary: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  applyButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.small,
  },
  applyButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
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
  prize: {
    ...theme.typography.body,
    fontWeight: 'bold',
    color: theme.colors.primary,
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
  actionButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  spacer: {
    flex: 1,
  },
  contestCard: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
    marginLeft: 0,
    marginRight: theme.spacing.sm,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
  },
  contestTitle: {
    fontSize: 13,
  },
  contestText: {
    fontSize: 11,
  },
  contestDescription: {
    fontSize: 11,
    lineHeight: 16,
  },
  contestPrize: {
    fontSize: 12,
  },
  contestButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
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
  adContainer: {
    position: 'absolute',
    bottom: 60, // 탭바 위에 위치
    left: 0,
    right: 0,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  plusButton: {
    backgroundColor: theme.colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recruitCard: {
    padding: theme.spacing.md,
  },
});

