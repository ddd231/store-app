import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Switch, Dimensions, Platform } from 'react-native';
import { theme } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import QRCodeModal from '../components/QRCodeModal';
import { supabase } from '../services/supabaseClient';
import notificationService from '../services/notificationService';

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 3;
const galleryCardWidth = (width - 60) / 3;

export default function ProfileScreen({ navigation, route }) {
  const [selectedTab, setSelectedTab] = useState('portfolio');
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [myWorks, setMyWorks] = useState([]);
  const [myGalleries, setMyGalleries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  
  // route에서 userId 파라미터 확인
  const viewingUserId = route?.params?.userId;
  const viewingUserName = route?.params?.userName;
  const [currentUser, setCurrentUser] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(true);
  
  useEffect(() => {
    checkCurrentUser();
  }, [viewingUserId]); // viewingUserId가 변경될 때도 재실행
  
  useEffect(() => {
    
    // currentUser가 null이어도 다른 사용자 프로필은 볼 수 있어야 함
    if (viewingUserId) {
      // 다른 사용자 프로필을 보는 경우
      const newIsOwnProfile = currentUser ? (viewingUserId === currentUser.id) : false;
      setIsOwnProfile(newIsOwnProfile);
      
      
      loadUserAndWorksForUser(newIsOwnProfile);
    } else if (currentUser !== null) {
      // 내 프로필을 보는 경우 (로그인 필요)
      setIsOwnProfile(true);
      
      
      loadUserAndWorksForUser(true);
    }
  }, [viewingUserId, currentUser]);

  useEffect(() => {
    // 화면에 포커스될 때마다 프로필 새로고침
    const unsubscribe = navigation.addListener('focus', () => {
      checkCurrentUser();
      if (currentUser !== null) {
        const currentIsOwnProfile = viewingUserId ? (viewingUserId === currentUser.id) : true;
        loadUserAndWorksForUser(currentIsOwnProfile);
      }
    });

    return unsubscribe;
  }, [navigation, currentUser, viewingUserId]);
  
  const checkCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
    
    // 현재 로그인한 사용자와 보려는 프로필이 같은지 확인
    if (viewingUserId && user) {
      const isOwn = viewingUserId === user.id;
      setIsOwnProfile(isOwn);
    } else if (!viewingUserId) {
      // viewingUserId가 없으면 내 프로필
      setIsOwnProfile(true);
    }
  };

  const loadUserAndWorksForUser = async (isOwnProfileParam) => {
    try {
      setLoading(true);
      
      // 보려는 사용자 ID 결정 (파라미터로 받았으면 그 사용자, 아니면 현재 사용자)
      const targetUserId = viewingUserId || currentUser?.id;
      
      
      if (targetUserId) {
        // 프로필을 보려는 사용자 설정
        if (isOwnProfileParam) {
          setUser(currentUser);
        } else {
          // 다른 사용자 프로필일 경우 기본 정보만 설정
          setUser({ id: targetUserId });
        }
        
        // 사용자 프로필 정보 가져오기
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', targetUserId)
          .single();
        
        if (!profileError && profile) {
          setUserProfile(profile);
        }
        
        // 해당 사용자가 올린 작품들 가져오기
        const { data: works, error } = await supabase
          .from('works')
          .select('*')
          .eq('author_id', targetUserId)
          .order('created_at', { ascending: false });
        
        if (!error) {
          setMyWorks(works || []);
        } else {
          console.error('Profile works error:', error);
        }

        // 해당 사용자의 갤러리들 가져오기
        const { data: galleries, error: galleriesError } = await supabase
          .from('galleries')
          .select('*')
          .eq('creator_id', targetUserId)
          .order('created_at', { ascending: false });

        if (!galleriesError) {
          setMyGalleries(galleries || []);
        } else {
          console.error('Profile galleries error:', galleriesError);
        }
      }
    } catch (error) {
      console.error('작품 로딩 오류:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const profileStats = [
    { label: '작품', value: myWorks.length.toString() },
    { label: '참여', value: '0' },
    { label: '완료', value: '0' },
  ];

  const tabButtons = [
    { id: 'portfolio', name: 'PORTFOLIO' },
    { id: 'info', name: 'INFO' },
    { id: 'gallery', name: 'GALLERY' },
  ];

  const menuItems = [
    { id: 'friends', title: '친구 목록', icon: 'people-outline' },
    { id: 'saved', title: '북마크', icon: 'bookmark-outline' },
    { id: 'settings', title: '설정', icon: 'settings-outline' },
  ];

  const handleQRCode = () => {
    setQrModalVisible(true);
  };

  const handleAddFriend = async () => {
    try {
      if (!currentUser) {
        alert('로그인이 필요합니다.');
        return;
      }

      // 이미 친구 요청을 보냈는지 확인
      const { data: existingFriend } = await supabase
        .from('friends')
        .select('id, status')
        .eq('user_id', currentUser.id)
        .eq('friend_id', viewingUserId)
        .single();

      if (existingFriend) {
        if (existingFriend.status === 'accepted') {
          alert('이미 친구입니다.');
        } else if (existingFriend.status === 'pending') {
          alert('이미 친구 요청을 보냈습니다.');
        }
        return;
      }

      // 친구 추가 로직
      
      const { data, error } = await supabase
        .from('friends')
        .insert([
          {
            user_id: currentUser.id,
            friend_id: viewingUserId,
            status: 'pending'
          }
        ])
        .select();


      if (error) {
        console.error('친구 추가 오류:', error);
        alert('친구 추가에 실패했습니다.');
      } else {
        // 친구 요청 알림 발송 (로컬)
        await notificationService.scheduleLocalNotification(
          '친구 요청 전송됨',
          `${viewingUserName || '사용자'}님에게 친구 요청을 보냈습니다.`,
          { type: 'friend_request_sent' }
        );
        
        alert('친구 요청을 보냈습니다.');
      }
    } catch (error) {
      console.error('친구 추가 오류:', error);
      alert('친구 추가에 실패했습니다.');
    }
  };

  const renderHeader = () => (
    <View>
      {/* 헤더 */}
      <View style={styles.header}>
        <View style={styles.leftSection}>
          {!isOwnProfile ? (
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
          ) : (
            <Text style={styles.title}>내 프로필</Text>
          )}
        </View>
        
        <View style={styles.rightSection}>
          {isOwnProfile ? (
            <TouchableOpacity onPress={() => navigation.navigate('ProfileEdit')}>
              <Ionicons name="create-outline" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.addFriendButton} onPress={handleAddFriend}>
              <Ionicons name="person-add-outline" size={20} color="white" />
              <Text style={styles.addFriendText}>친구추가</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 프로필 정보 */}
      <View style={styles.profileSection}>
        <Text style={styles.userName}>
          {userProfile?.username || viewingUserName || '사용자 이름'}
        </Text>
        <Text style={styles.userBio}>{userProfile?.short_intro || (isOwnProfile ? '짧은 소개를 작성해보세요' : '')}</Text>
        
        {/* 통계 */}
        <View style={styles.statsContainer}>
          {profileStats.map((stat, index) => (
            <View key={index} style={styles.statItem}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* QR 코드 버튼 - 본인 프로필에서만 표시 */}
        {isOwnProfile && (
          <TouchableOpacity 
            style={styles.qrButton} 
            onPress={handleQRCode}
          >
            <Text style={styles.qrButtonText}>QR 코드</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 작품 업로드 버튼 - 본인 프로필에서만 표시 */}
      {isOwnProfile && (
        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => navigation.navigate('WorkTypeSelect')}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="cloud-upload-outline" size={24} color={theme.colors.text.primary} />
            <Text style={styles.settingText}>작품 업로드하기</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
        </TouchableOpacity>
      )}

      {/* 포트폴리오 탭 */}
      <View style={styles.tabsContainer}>
        {tabButtons.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tabButton,
              selectedTab === tab.id && styles.tabButtonActive
            ]}
            onPress={() => setSelectedTab(tab.id)}
          >
            <Text style={[
              styles.tabText,
              selectedTab === tab.id && styles.tabTextActive
            ]}>
              {tab.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* INFO 탭 */}
      {selectedTab === 'info' && (
        <View style={styles.infoContainer}>
          {userProfile?.info ? (
            <Text style={styles.infoText}>{userProfile.info}</Text>
          ) : (
            <Text style={styles.comingSoon}>정보를 추가해보세요</Text>
          )}
        </View>
      )}

      {/* GALLERY 탭 */}
      {selectedTab === 'gallery' && (
        <View style={styles.galleryContainer}>
          <View style={styles.galleriesGrid}>
            {/* 기존 갤러리들 */}
            {myGalleries.map(gallery => (
              <TouchableOpacity 
                key={gallery.id} 
                style={styles.galleryCard}
                onPress={() => navigation.navigate('GalleryDetail', { galleryId: gallery.id })}
              >
                <View style={styles.galleryThumbnail}>
                  <Ionicons name="folder" size={32} color={theme.colors.primary} />
                </View>
                <Text style={styles.galleryName} numberOfLines={1}>{gallery.name}</Text>
                <Text style={styles.galleryWorkCount}>{gallery.work_ids?.length || 0}개 작품</Text>
              </TouchableOpacity>
            ))}
            
            {/* 갤러리 생성 버튼 */}
            {isOwnProfile && (
              <TouchableOpacity 
                style={styles.createGalleryButton}
                onPress={() => navigation.navigate('CreateGallery')}
              >
                <View style={[styles.galleryThumbnail, { borderStyle: 'dashed', borderWidth: 2 }]}>
                  <Ionicons name="add" size={32} color={theme.colors.text.secondary} />
                </View>
              </TouchableOpacity>
            )}
          </View>
          
          {myGalleries.length === 0 && !isOwnProfile && (
            <Text style={styles.emptyText}>아직 갤러리가 없습니다</Text>
          )}
        </View>
      )}


      {/* 로딩 상태 */}
      {loading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>로딩 중...</Text>
        </View>
      )}

    </View>
  );

  const renderFooter = () => (
    <View>
      {/* 메뉴 - 본인 프로필에서만 표시 */}
      {isOwnProfile && (
        <>
          <View style={styles.menuSection}>
            {menuItems.map(item => (
              <TouchableOpacity 
                key={item.id} 
                style={styles.menuItem}
                onPress={() => {
                  if (item.id === 'settings') {
                    navigation.navigate('Settings');
                  } else if (item.id === 'saved') {
                    navigation.navigate('Bookmarks');
                  } else if (item.id === 'friends') {
                    navigation.navigate('FriendsList');
                  }
                }}
              >
                <View style={styles.menuLeft}>
                  <Ionicons name={item.icon} size={24} color={theme.colors.text.primary} />
                  <Text style={styles.menuText}>{item.title}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
              </TouchableOpacity>
            ))}
          </View>

          {/* 로그아웃 */}
          <TouchableOpacity style={styles.logoutButton}>
            <Text style={styles.logoutText}>로그아웃</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  const renderWorkItem = ({ item }) => {
    // 안전성 검사
    if (!item || typeof item !== 'object') {
      return null;
    }
    
    
    
    return (
      <TouchableOpacity 
        style={styles.workCard}
        onPress={() => navigation.navigate('WorkDetail', { workId: item.id, work: item })}
      >
        {item.type === 'novel' && item.content ? (
          <View style={styles.novelPreview}>
            <Text style={styles.novelPreviewText} numberOfLines={7}>
              {item.content || '내용 없음'}
            </Text>
          </View>
        ) : item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.workImage} />
        ) : (
          <View style={styles.workPlaceholder}>
            <Ionicons 
              name={item.type === 'painting' ? 'color-palette-outline' : 'book-outline'} 
              size={50} 
              color={theme.colors.text.secondary} 
            />
          </View>
        )}
        <Text style={styles.workTitle} numberOfLines={1}>
          {item.title || '제목 없음'}
        </Text>
        <Text style={styles.workCategory}>
          {item.category || '카테고리 없음'}
        </Text>
      </TouchableOpacity>
    );
  };

  const portfolioData = useMemo(() => {
    return selectedTab === 'portfolio' ? myWorks : [];
  }, [selectedTab, myWorks]);

  return (
    <View style={styles.container}>
      <FlatList
        data={portfolioData}
        renderItem={renderWorkItem}
        keyExtractor={(item, index) => item?.id?.toString() || index.toString()}
        numColumns={3}
        columnWrapperStyle={portfolioData.length > 1 ? styles.portfolioRow : null}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.flatListContent}
        removeClippedSubviews={false}
      />
      
      <QRCodeModal
        visible={qrModalVisible}
        onClose={() => setQrModalVisible(false)}
        userId={currentUser?.id || ''}
        userName={userProfile?.username || '사용자 이름'}
      />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 0, // 패딩 완전 제거
    paddingTop: 45, // 위로 올리기
    paddingBottom: theme.spacing.md,
  },
  leftSection: {
    flex: 1,
    alignItems: 'flex-start',
    paddingLeft: theme.spacing.lg, // 더 많은 패딩
  },
  rightSection: {
    flex: 1,
    alignItems: 'flex-end',
    paddingRight: theme.spacing.lg, // 더 많은 패딩
  },
  backButton: {
    padding: theme.spacing.sm,
    marginLeft: -theme.spacing.sm, // 조금만 왼쪽으로
  },
  addFriendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  addFriendText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: theme.spacing.xs,
    fontSize: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginLeft: 0, // 마진 제거하여 최대한 왼쪽으로
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xxl,
    paddingBottom: theme.spacing.xl,
  },
  userName: {
    ...theme.typography.heading,
    marginBottom: theme.spacing.sm,
  },
  userBio: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.lg,
  },
  statItem: {
    alignItems: 'center',
    marginHorizontal: theme.spacing.xl,
  },
  statValue: {
    ...theme.typography.heading,
    fontWeight: '600',
  },
  statLabel: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
  qrButton: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  qrButtonText: {
    ...theme.typography.body,
    fontWeight: '600',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderTopWidth: 0.5,
    borderTopColor: theme.colors.border,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    ...theme.typography.body,
    marginLeft: theme.spacing.md,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xxl, // 탭과 컨텐츠 사이 간격
    paddingHorizontal: theme.spacing.lg,
  },
  tabButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  tabTextActive: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  contentArea: {
    minHeight: 300,
  },
  portfolioContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  loadingText: {
    textAlign: 'center',
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xl,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: theme.spacing.xxl,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  uploadPromptButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
  uploadPromptText: {
    color: 'white',
    fontWeight: '600',
  },
  flatListContent: {
    paddingHorizontal: 0, // 양옆 패딩 완전 제거
    paddingBottom: 20,
  },
  portfolioRow: {
    justifyContent: 'space-evenly', // 균등 배치
    paddingHorizontal: 10, // 최소한의 좌우 여백
  },
  loadingContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  workCard: {
    width: cardWidth,
    marginBottom: theme.spacing.xl, // 작품 간 세로 간격
  },
  addWorkButton: {
    opacity: 0.7,
  },
  workImage: {
    width: '100%',
    height: cardWidth * 1.2,
    borderRadius: theme.borderRadius.medium,
    backgroundColor: theme.colors.background,
    marginBottom: theme.spacing.sm,
  },
  workPlaceholder: {
    width: '100%',
    height: cardWidth * 1.2,
    borderRadius: theme.borderRadius.medium,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
  },
  novelPreview: {
    width: '100%',
    height: cardWidth * 1.2,
    borderRadius: theme.borderRadius.medium,
    backgroundColor: 'white',
    padding: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
    overflow: 'hidden',
  },
  novelPreviewText: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.text.primary,
    textAlign: 'left',
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
  },
  workTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  workCategory: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  infoContainer: {
    padding: theme.spacing.lg,
  },
  infoText: {
    ...theme.typography.body,
    lineHeight: 22,
    color: theme.colors.text.primary,
  },
  galleryContainer: {
    paddingTop: theme.spacing.xs,
    paddingBottom: theme.spacing.lg,
    paddingHorizontal: 0, // 양옆 패딩 제거
  },
  galleriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start', // 왼쪽부터 채우기
    paddingLeft: 20,
    paddingRight: 14,
  },
  galleryCard: {
    width: galleryCardWidth,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
  },
  galleryThumbnail: {
    width: galleryCardWidth,
    height: galleryCardWidth,
    borderRadius: theme.borderRadius.medium,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
  },
  galleryName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: 2,
  },
  galleryWorkCount: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  galleryGrid: {
    // 갤러리 그리드 스타일 추후 추가
  },
  comingSoon: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
  },
  menuSection: {
    marginTop: theme.spacing.lg,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.colors.border,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuText: {
    ...theme.typography.body,
    marginLeft: theme.spacing.md,
  },
  logoutButton: {
    marginTop: theme.spacing.xl,
    marginBottom: 100,
    marginHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  logoutText: {
    ...theme.typography.body,
    color: theme.colors.error,
    fontWeight: '600',
  },
  createGalleryButton: {
    width: galleryCardWidth,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
  },
});