import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Alert, Platform, Linking } from 'react-native';
import { theme } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../shared';
import { useLanguage } from '../contexts/LanguageContext';

export default function HomeMenu({ visible, onClose, navigation }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  
  const { t } = useLanguage();

  useEffect(function() {
    if (visible) {
      loadUserData();
    }
  }, [visible]);

  async function loadUserData() {
    try {
      console.log('[HomeMenu] 사용자 데이터 로드 시작');
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        console.log('[HomeMenu] 사용자 정보:', user.id);
        
        // 사용자 프로필 로드
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        console.log('[HomeMenu] 프로필 조회 결과:', { profile, error });
          
        if (profile) {
          setUserProfile(profile);
          console.log('[HomeMenu] 프로필 설정 완료:', {
            is_premium: profile.is_premium,
            is_admin: profile.is_admin
          });
        } else {
          console.warn('[HomeMenu] 프로필이 없습니다');
          setUserProfile(null);
        }
      } else {
        console.warn('[HomeMenu] 사용자가 없습니다');
      }
    } catch (error) {
      console.error('[HomeMenu] 사용자 정보 로드 오류:', error);
    }
  };

  async function handleLogout() {
    Alert.alert(
      t('logout'),
      t('logoutConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('logout'),
          style: 'destructive',
          onPress: async function() {
            await supabase.auth.signOut();
            onClose();
            navigation.navigate('Login');
          }
        }
      ]
    );
  };

  const menuItems = [
    // { id: 'upload', title: t('uploadWork'), icon: 'cloud-upload-outline', screen: 'WorkTypeSelect' },
    { id: 'view_history', title: t('history'), icon: 'time-outline', screen: 'ViewHistory' },
    { id: 'bookmarks', title: t('bookmarks'), icon: 'bookmark-outline', screen: 'Bookmarks' },
    { id: 'settings', title: t('settings'), icon: 'settings-outline', screen: 'Settings' },
    { id: 'help', title: t('help'), icon: 'help-circle-outline' },
    // { id: 'store', title: t('store'), icon: 'bag-outline', screen: 'Store' },
  ];

  async function handleMenuPress(item) {
    console.log('[HomeMenu] 메뉴 클릭:', item.id);
    
    if (item.id === 'store') {
      // arld store는 웹으로 이동
      const storeUrl = process.env.EXPO_PUBLIC_STORE_URL || 'https://arldstore.netlify.app';
      if (Platform.OS === 'web') {
        window.open(storeUrl, '_blank');
      } else {
        // 모바일에서는 Linking 사용
        Linking.openURL(storeUrl);
      }
      onClose();
    } else if (item.id === 'help') {
      // 문의하기 - 이메일 링크
      try {
        const url = 'mailto:arldsty@gmail.com?subject=ARLD 문의&body=안녕하세요.%0A%0A문의 내용을 작성해주세요.';
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
        } else {
          Alert.alert(t('error'), 'Cannot open email app.');
        }
      } catch (error) {
        Alert.alert(t('error'), 'Failed to send email.');
      }
      onClose();
    } else if (item.id === 'view_history') {
      console.log('[HomeMenu] 기록 메뉴 클릭 - 프리미엄 상태 확인');
      console.log('[HomeMenu] 현재 userProfile:', userProfile);
      console.log('[HomeMenu] is_premium:', userProfile?.is_premium);
      console.log('[HomeMenu] is_admin:', userProfile?.is_admin);
      
      // 기록 메뉴 - 프리미엄 상태 확인 후 이동
      if (!userProfile?.is_premium && !userProfile?.is_admin) {
        console.log('[HomeMenu] 프리미엄 권한 없음 - 업그레이드 알림 표시');
        Alert.alert(
          t('premiumRequired'),
          t('upgradeToViewHistory'),
          [
            { text: t('cancel'), style: 'cancel' },
            { 
              text: t('upgrade'), 
              onPress: function() {
                console.log('[HomeMenu] 업그레이드 페이지로 이동');
                navigation.navigate('Upgrade');
                onClose();
              }
            }
          ]
        );
        return;
      }
      console.log('[HomeMenu] 프리미엄 권한 있음 - ViewHistory로 이동');
      navigation.navigate('ViewHistory');
      onClose();
    } else if (item.screen) {
      console.log('[HomeMenu] 일반 화면 이동:', item.screen);
      navigation.navigate(item.screen);
      onClose();
    } else {
      // 나중에 구현할 화면들
      console.log('[HomeMenu] 준비 중인 기능:', item.title);
      Alert.alert(t('notification'), `${item.title} ${t('comingSoon')}`);
      onClose();
    }
  };

  function handleUpgradePress() {
    navigation.navigate('Upgrade');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={[StyleSheet.absoluteFillObject]} 
          activeOpacity={1} 
          onPress={onClose}
        />
        <View style={styles.menuContainer}>
          <TouchableOpacity activeOpacity={1}>
            {/* 헤더 */}
            <View style={styles.menuHeader}>
              <Text style={styles.menuTitle}>{t('menu')}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#000000" />
              </TouchableOpacity>
            </View>

            {/* 사용자 정보 */}
            <View style={styles.userSection}>
              <Text style={styles.userName}>
                {userProfile?.username || user?.email?.split('@')[0] || t('user')}
              </Text>
              <Text style={styles.userEmail}>
                {user?.email || t('noLoginInfo')}
              </Text>
            </View>

            {/* 전문가 업그레이드 버튼 */}
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={function() {
                if (userProfile?.is_premium) {
                  Alert.alert(t('expertAccount'), t('alreadyExpert'));
                } else {
                  handleUpgradePress();
                }
              }}
            >
              <View style={styles.menuItemLeft}>
                <Text style={[styles.menuItemText, { marginLeft: 0 }]}>
                  {userProfile?.is_premium ? t('expertAccount') : t('upgradeToExpert')}
                </Text>
              </View>
              <Ionicons 
                name={userProfile?.is_premium ? "checkmark-circle" : "chevron-forward"} 
                size={20} 
                color={userProfile?.is_premium ? theme.colors.primary : "#000000"} 
              />
            </TouchableOpacity>

            {/* 메뉴 리스트 */}
            <ScrollView style={styles.menuList}>
              {menuItems.map(function(item) { return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.menuItem}
                  onPress={function() { return handleMenuPress(item); }}
                >
                  <View style={styles.menuItemLeft}>
                    <Ionicons 
                      name={item.icon} 
                      size={24} 
                      color="#000000" 
                    />
                    <Text style={styles.menuItemText}>{item.title}</Text>
                  </View>
                  <Ionicons 
                    name="chevron-forward" 
                    size={20} 
                    color="#000000" 
                  />
                </TouchableOpacity>
              ); })}
            </ScrollView>

          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    width: '80%',
    maxWidth: 350,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.large,
    overflow: 'hidden',
    ...theme.shadows.large,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  menuTitle: {
    ...theme.typography.heading,
    fontWeight: '600',
    color: '#000000',
  },
  closeButton: {
    padding: theme.spacing.sm,
  },
  userSection: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  userName: {
    ...theme.typography.body,
    fontWeight: '600',
    marginBottom: 4,
    color: '#000000',
  },
  userEmail: {
    ...theme.typography.caption,
    color: '#8E8E93', // 회색 유지
  },
  menuList: {
    maxHeight: 300,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    ...theme.typography.body,
    marginLeft: theme.spacing.md,
    color: '#000000',
  },
});

