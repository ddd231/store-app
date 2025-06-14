import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Alert, Platform, Linking } from 'react-native';
import { theme } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabaseClient';

export default function HomeMenu({ visible, onClose, navigation }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    if (visible) {
      loadUserData();
    }
  }, [visible]);

  const loadUserData = async () => {
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

  const handleLogout = async () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '로그아웃',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            onClose();
            navigation.navigate('Login');
          }
        }
      ]
    );
  };

  const menuItems = [
    { id: 'view_history', title: '기록', icon: 'time-outline', screen: 'ViewHistory' },
    { id: 'bookmarks', title: '북마크', icon: 'bookmark-outline', screen: 'Bookmarks' },
    { id: 'settings', title: '설정', icon: 'settings-outline', screen: 'Settings' },
    { id: 'help', title: '도움말', icon: 'help-circle-outline' },
    { id: 'store', title: '스토어', icon: 'bag-outline', screen: 'Store' },
  ];

  const handleMenuPress = (item) => {
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
    } else if (item.screen) {
      navigation.navigate(item.screen);
      onClose();
    } else {
      // 나중에 구현할 화면들
      Alert.alert('알림', `${item.title} 기능은 준비 중입니다.`);
      onClose();
    }
  };

  const handleUpgradePress = () => {
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
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <View style={styles.menuContainer}>
          <TouchableOpacity activeOpacity={1}>
            {/* 헤더 */}
            <View style={styles.menuHeader}>
              <Text style={styles.menuTitle}>메뉴</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>

            {/* 사용자 정보 */}
            <View style={styles.userSection}>
              <Text style={styles.userName}>
                {userProfile?.username || user?.email?.split('@')[0] || '사용자'}
              </Text>
              <Text style={styles.userEmail}>
                {user?.email || '로그인 정보 없음'}
              </Text>
            </View>

            {/* 전문가 업그레이드 버튼 */}
            <TouchableOpacity style={styles.menuItem} onPress={() => handleUpgradePress()}>
              <View style={styles.menuItemLeft}>
                <Text style={[styles.menuItemText, { marginLeft: 0 }]}>전문가로 업그레이드</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
            </TouchableOpacity>

            {/* 메뉴 리스트 */}
            <ScrollView style={styles.menuList}>
              {menuItems.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.menuItem}
                  onPress={() => handleMenuPress(item)}
                >
                  <View style={styles.menuItemLeft}>
                    <Ionicons 
                      name={item.icon} 
                      size={24} 
                      color={theme.colors.text.primary} 
                    />
                    <Text style={styles.menuItemText}>{item.title}</Text>
                  </View>
                  <Ionicons 
                    name="chevron-forward" 
                    size={20} 
                    color={theme.colors.text.secondary} 
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* 로그아웃 */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutText}>로그아웃</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
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
  },
  userEmail: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
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