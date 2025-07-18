import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { supabase } from '../../shared';
import { checkPremiumAccess } from '../../shared/utils/premiumUtils';
import BoardFilters from './BoardFilters';

const BoardHeader = React.memo(function BoardHeader({ 
  selectedCategory,
  contestFilter,
  onFilterChange,
  isAdmin,
  user,
  navigation,
  checkPremiumOrAdminAccess,
  t 
}) {
  
  const handlePostJobPress = async () => {
    console.log('🎯 [채용협업] 업로드 버튼 클릭됨');
    try {
      // 현재 사용자 확인
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      console.log('🎯 [채용협업] 현재 사용자:', currentUser?.id, currentUser?.email);
      
      if (!currentUser) {
        console.log('🎯 [채용협업] 사용자 없음 - 리턴');
        return;
      }

      // 프리미엄 권한 체크 (만료일 포함)
      const accessResult = await checkPremiumAccess(currentUser.id);
      console.log('🎯 [채용협업] 권한 체크 결과:', accessResult);
      
      if (!accessResult.isPremium && !accessResult.isAdmin) {
        console.log('🎯 [채용협업] 권한 없음 - Upgrade로 이동');
        navigation.navigate('Upgrade');
        return;
      }

      console.log('🎯 [채용협업] 권한 있음 - JobPost로 이동');
      setTimeout(() => {
        navigation.navigate('JobPost');
        console.log('🎯 [채용협업] setTimeout navigation 완료');
      }, 100);
    } catch (error) {
      console.error('🎯 [채용협업] 권한 확인 오류 - Upgrade로 이동:', error);
      navigation.navigate('Upgrade');
    }
  };

  const handleBlogWritePress = () => {
    navigation.navigate('BlogEdit');
  };

  const handleContestCreatePress = async () => {
    console.log('🎯 [컨테스트] 업로드 버튼 클릭됨');
    try {
      // 현재 사용자 확인
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      console.log('🎯 [컨테스트] 현재 사용자:', currentUser?.id, currentUser?.email);
      
      if (!currentUser) {
        console.log('🎯 [컨테스트] 사용자 없음 - 리턴');
        return;
      }

      // 프리미엄 권한 체크 (만료일 포함)
      const accessResult = await checkPremiumAccess(currentUser.id);
      console.log('🎯 [컨테스트] 권한 체크 결과:', accessResult);
      
      if (!accessResult.isPremium && !accessResult.isAdmin) {
        console.log('🎯 [컨테스트] 권한 없음 - Upgrade로 이동');
        navigation.navigate('Upgrade');
        return;
      }

      console.log('🎯 [컨테스트] 권한 있음 - ContestEdit으로 이동');
      setTimeout(() => {
        navigation.navigate('ContestEdit');
        console.log('🎯 [컨테스트] setTimeout navigation 완료');
      }, 100);
    } catch (error) {
      console.error('🎯 [컨테스트] 권한 확인 오류 - Upgrade로 이동:', error);
      navigation.navigate('Upgrade');
    }
  };

  const getSectionTitle = () => {
    switch (selectedCategory) {
      case 'recruit':
        return t('jobPostsList');
      case 'blog':
        return t('blog');
      case 'contest':
        return null; // 컨테스트는 필터가 제목 역할
      default:
        return '';
    }
  };

  const renderActionButton = () => {
    switch (selectedCategory) {
      case 'recruit':
        return (
          <TouchableOpacity 
            style={styles.postJobButton}
            onPress={handlePostJobPress}
          >
            <Text style={styles.postJobButtonText}>{t('postJob')}</Text>
          </TouchableOpacity>
        );
      case 'blog':
        if (isAdmin) {
          return (
            <TouchableOpacity 
              style={styles.postJobButton}
              onPress={handleBlogWritePress}
            >
              <Text style={styles.postJobButtonText}>{t('writeBlog')}</Text>
            </TouchableOpacity>
          );
        }
        return null;
      case 'contest':
        return (
          <TouchableOpacity 
            style={styles.plusButton}
            onPress={handleContestCreatePress}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.sectionHeader}>
      {selectedCategory === 'recruit' && (
        <Text style={styles.sectionTitle}>{getSectionTitle()}</Text>
      )}
      {selectedCategory === 'blog' && (
        <Text style={styles.sectionTitle}>{getSectionTitle()}</Text>
      )}
      {selectedCategory === 'contest' && (
        <BoardFilters 
          contestFilter={contestFilter}
          onFilterChange={onFilterChange}
          t={t}
        />
      )}
      <View style={styles.spacer} />
      {renderActionButton()}
    </View>
  );
});

const styles = StyleSheet.create({
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
  plusButton: {
    backgroundColor: theme.colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spacer: {
    flex: 1,
  },
});

export default BoardHeader;