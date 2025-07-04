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
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        
        // 사용자 프로필 로드
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (profile) {
          setUserProfile(profile);
        }
      }
    } catch (error) {
      if (__DEV__) console.error('사용자 정보 로드 오류:', error);
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
    } else if (item.screen) {
      navigation.navigate(item.screen);
      onClose();
    } else {
      // 나중에 구현할 화면들
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
                color={userProfile?.is_premium ? theme.colors.primary : theme.colors.text.secondary} 
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
                    color={theme.colors.text.secondary} 
                  />
                </TouchableOpacity>
              ); })}
            </ScrollView>

            {/* 로그아웃 */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutText}>{t('logout')}</Text>
            </TouchableOpacity>
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
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
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
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
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
    borderBottomWidth: 0.5,
    borderBottomColor: theme.colors.border,
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
  logoutButton: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  logoutText: {
    ...theme.typography.body,
    color: theme.colors.error,
    fontWeight: '600',
  },
});

