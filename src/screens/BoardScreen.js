import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, RefreshControl } from 'react-native';
import { theme } from '../styles/theme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { getJobPosts } from '../services/jobService';
import AnimatedButton from '../components/AnimatedButton';

export default function BoardScreen({ navigation }) {
  const [selectedCategory, setSelectedCategory] = useState('recruit');
  const [jobPosts, setJobPosts] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const categories = [
    { id: 'contest', name: '컨테스트' },
    { id: 'blog', name: '블로그' },
    { id: 'recruit', name: '채용' },
  ];

  // 채용공고 데이터 로드
  const loadJobPosts = async () => {
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

  // 새로고침
  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadJobPosts();
    setIsRefreshing(false);
  };

  // 컴포넌트 마운트 시 채용공고 로드
  useEffect(() => {
    loadJobPosts();
  }, []);

  // 탭 포커스 시 데이터 새로고침
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (selectedCategory === 'recruit') {
        loadJobPosts();
      }
    });

    return unsubscribe;
  }, [navigation, selectedCategory]);

  const allData = [
    // 컨테스트
    {
      id: 4,
      title: '2025 디지털 아트 공모전',
      organizer: 'ARLD 아트센터',
      period: '2025.01.01 ~ 2025.03.31',
      prize: '대상 500만원',
      description: '디지털 아트 분야의 새로운 인재를 발굴하는 공모전입니다. 자유 주제로 창작해주세요.',
      type: 'contest',
      tags: ['디지털아트', '공모전', '창작']
    },
    {
      id: 5,
      title: '웹소설 신인상 공모',
      organizer: '한국웹소설협회',
      period: '2025.02.01 ~ 2025.05.31',
      prize: '최우수상 1000만원',
      description: '참신한 아이디어와 스토리텔링을 가진 웹소설 작품을 모집합니다.',
      type: 'contest',
      tags: ['웹소설', '신인상', '스토리']
    },
    // 블로그
    {
      id: 6,
      title: '아티스트를 위한 포트폴리오 제작 가이드',
      author: 'ARLD 에디터',
      date: '2025.06.01',
      readTime: '5분',
      description: '효과적인 포트폴리오 구성 방법과 주의사항을 알아보세요. 작품 선별부터 레이아웃까지 상세 가이드.',
      type: 'blog',
      tags: ['포트폴리오', '가이드', '팁']
    },
    {
      id: 7,
      title: '2025년 아트 트렌드 전망',
      author: '김아트',
      date: '2025.05.28',
      readTime: '8분',
      description: '올해 주목받을 아트 트렌드와 새로운 기법들을 분석해보았습니다. AI 아트부터 전통 기법의 재해석까지.',
      type: 'blog',
      tags: ['트렌드', '분석', '2025']
    },
    {
      id: 8,
      title: '웹소설 작가 데뷔 후기',
      author: '이소설',
      date: '2025.05.25',
      readTime: '12분',
      description: '신인 작가의 생생한 데뷔 경험담. 어려움과 보람, 그리고 앞으로의 계획을 솔직하게 공유합니다.',
      type: 'blog',
      tags: ['데뷔후기', '경험담', '작가']
    },
  ];

  // 카테고리별 데이터 필터링
  const getFilteredData = () => {
    if (selectedCategory === 'recruit') {
      // 실제 채용공고 데이터를 변환하여 반환
      return jobPosts.map(job => ({
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
      }));
    } else {
      // 다른 카테고리는 더미 데이터 사용
      return allData.filter(item => item.type === selectedCategory);
    }
  };

  const filteredData = getFilteredData();

  const renderItem = ({ item }) => {
    if (item.type === 'recruit') {
      return (
        <TouchableOpacity 
          style={styles.card}
          onPress={() => navigation.navigate('JobDetail', { jobId: item.id })}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          
          <Text style={styles.companyName}>{item.company}</Text>
          <Text style={styles.location}>{item.location}</Text>
          
          <Text style={styles.description} numberOfLines={3}>
            {item.description}
          </Text>
          
          <View style={styles.cardFooter}>
            <View style={styles.spacer} />
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>지원하기</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      );
    } else if (item.type === 'contest') {
      return (
        <TouchableOpacity 
          style={[styles.card, styles.contestCard]}
          onPress={() => navigation.navigate('ContestDetail', { contest: item })}>
          <Text style={[styles.cardTitle, styles.contestTitle]}>{item.title}</Text>
          
          <Text style={[styles.organizerName, styles.contestText]}>{item.organizer}</Text>
          <Text style={[styles.period, styles.contestText]}>{item.period}</Text>
          
          <Text style={[styles.description, styles.contestDescription]} numberOfLines={2}>
            {item.description}
          </Text>
          
          <View style={styles.cardFooter}>
            <Text style={[styles.prize, styles.contestPrize]}>{item.prize}</Text>
          </View>
        </TouchableOpacity>
      );
    } else if (item.type === 'blog') {
      return (
        <TouchableOpacity 
          style={styles.card}
          onPress={() => navigation.navigate('BlogDetail', { blog: item })}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          
          <Text style={styles.authorName}>{item.author}</Text>
          <Text style={styles.dateInfo}>{item.date}</Text>
          
          <Text style={styles.description} numberOfLines={3}>
            {item.description}
          </Text>
          
          <View style={styles.cardFooter}>
            <View style={styles.tagContainer}>
              {item.tags.map((tag, index) => (
                <Text key={index} style={styles.tag}>#{tag}</Text>
              ))}
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
        {categories.map(category => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.tabButton,
              selectedCategory === category.id && styles.tabButtonActive
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Text style={[
              styles.tabText,
              selectedCategory === category.id && styles.tabTextActive
            ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 채용공고 올리기 버튼 - 채용 탭에서만 표시 */}
      {selectedCategory === 'recruit' && (
        <View style={styles.sectionHeader}>
          <View style={styles.spacer} />
          <TouchableOpacity 
            style={styles.postJobButton}
            onPress={() => navigation.navigate('JobPost')}
          >
            <Text style={styles.postJobButtonText}>채용공고 올리기</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 컨텐츠 리스트 */}
      {selectedCategory === 'contest' ? (
        <FlatList
          key="contest-grid"
          data={filteredData}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
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
        />
      ) : (
        <FlatList
          key="single-column"
          data={filteredData}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
            />
          }
        />
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
    paddingBottom: 100,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.medium,
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
});