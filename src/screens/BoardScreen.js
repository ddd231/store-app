import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Platform } from 'react-native';
import { theme } from '../styles/theme';
import { getJobPosts } from '../features/job';
import { getBlogPosts } from '../features/blog';
import { getContests } from '../features/contest';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase, isAdminUser, checkPremiumOrAdminAccess } from '../shared';
import { useAuth } from '../features/auth';
import BoardTabs from './components/BoardTabs';
import BoardHeader from './components/BoardHeader';
import RecruitCard from './components/RecruitCard';
import BlogCard from './components/BlogCard';
import ContestCard from './components/ContestCard';
import EmptyStates from './components/EmptyStates';
// AdMob 모듈을 조건부로 import
let BannerAd, BannerAdSize, TestIds;
try {
  const AdMob = require('react-native-google-mobile-ads');
  BannerAd = AdMob.BannerAd;
  BannerAdSize = AdMob.BannerAdSize;
  TestIds = AdMob.TestIds;
} catch (error) {
  console.log('AdMob not available in Expo Go');
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

  // 카테고리별 데이터 필터링 (메모이제이션 적용)
  const filteredData = useMemo(() => {
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
  }, [selectedCategory, jobPosts, blogPosts, contests, contestFilter]);

  // 이벤트 핸들러들 (useCallback 적용)
  const handleJobPress = useCallback((jobId) => {
    navigation.navigate('JobDetail', { jobId });
  }, [navigation]);

  const handleBlogPress = useCallback((blog) => {
    navigation.navigate('BlogDetail', { blog });
  }, [navigation]);

  const handleContestPress = useCallback((contest) => {
    navigation.navigate('ContestDetail', { contest });
  }, [navigation]);

  const handleCategoryChange = useCallback((category) => {
    setSelectedCategory(category);
  }, []);

  const handleFilterChange = useCallback((filter) => {
    setContestFilter(filter);
  }, []);

  function renderItem({ item }) {
    if (item.type === 'recruit') {
      return (
        <RecruitCard 
          item={item}
          onPress={handleJobPress}
        />
      );
    } else if (item.type === 'contest') {
      return (
        <ContestCard 
          item={item}
          onPress={handleContestPress}
        />
      );
    } else if (item.type === 'blog') {
      return (
        <BlogCard 
          item={item}
          onPress={handleBlogPress}
        />
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* 카테고리 탭 */}
      <BoardTabs 
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={handleCategoryChange}
      />

      {/* 헤더 및 액션 버튼 */}
      <BoardHeader 
        selectedCategory={selectedCategory}
        contestFilter={contestFilter}
        onFilterChange={handleFilterChange}
        isAdmin={isAdmin}
        user={user}
        navigation={navigation}
        checkPremiumOrAdminAccess={checkPremiumOrAdminAccess}
        t={t}
      />

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
            <EmptyStates selectedCategory="contest" t={t} />
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
            <EmptyStates selectedCategory={selectedCategory} t={t} />
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
              console.log('광고 로드 완료');
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
  listContent: {
    paddingBottom: 160, // 광고 공간 확보를 위해 증가
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
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
});

