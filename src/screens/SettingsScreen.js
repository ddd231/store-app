import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Switch,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { supabase, logger } from '../shared';
import { checkPremiumAccess } from '../shared/utils/premiumUtils';
import { useAuth } from '../features/auth/hooks/useAuth';
import { useLanguage } from '../contexts/LanguageContext';

export default function SettingsScreen({ navigation }) {
  const { user } = useAuth();
  const { t, currentLanguage, changeLanguage, getAvailableLanguages } = useLanguage();
  const [notifications, setNotifications] = useState(false); // 기본값 false로 변경
  const [loading, setLoading] = useState(false);
  const [userCountry, setUserCountry] = useState('KR');

  // 알림 설정 불러오기
  useEffect(function() {
    loadNotificationSettings();
    loadUserCountry();
  }, []);

  async function loadUserCountry() {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('country')
        .eq('id', user.id)
        .single();
      
      if (data?.country) {
        setUserCountry(data.country);
      }
    } catch (error) {
      console.error('국가 정보 로드 오류:', error);
    }
  };

  async function loadNotificationSettings() {
    try {
      const saved = await AsyncStorage.getItem('notifications_enabled');
      logger.log('AsyncStorage 알림 설정 로드:', saved);
      setNotifications(saved === 'true' || saved === true);
    } catch (error) {
      console.error('알림 설정 로드 실패:', error);
      setNotifications(false);
    }
  };


  function getCurrentLanguageName() {
    const languages = getAvailableLanguages();
    const current = languages.find(function(lang) { return lang.code === currentLanguage; });
    return current ? current.name : '한국어';
  };

  function getCurrentCountryName() {
    const countries = [
      { code: 'KR', name: '한국' },
      { code: 'JP', name: '일본' },
      { code: 'US', name: '미국' },
    ];
    const current = countries.find(function(country) { return country.code === userCountry; });
    return current ? current.name : '한국';
  };

  const settingsSections = [
    {
      title: t('account') || '계정',
      items: [
        { id: 'profile', title: t('profileEdit') || '프로필 편집', icon: 'person-outline', action: 'navigate' },
        { id: 'password', title: t('passwordChange') || '비밀번호 변경', icon: 'lock-closed-outline', action: 'navigate' },
      ]
    },
    {
      title: t('notifications') || '알림',
      items: [
        { id: 'notifications', title: t('pushNotifications') || '푸시 알림', icon: 'notifications-outline', action: 'toggle', value: notifications },
      ]
    },
    {
      title: t('privacy') || '개인정보',
      items: [
        { id: 'hidden_users', title: t('hiddenUsers') || '숨긴사용자 관리', icon: 'eye-off-outline', action: 'navigate' },
        { id: 'data', title: t('dataManagement') || '데이터 관리', icon: 'server-outline', action: 'navigate' },
      ]
    },
    {
      title: t('general') || '일반',
      items: [
        { id: 'language', title: t('language') || '언어', icon: 'language-outline', action: 'language', subtitle: getCurrentLanguageName() },
      ]
    },
    {
      title: t('info') || '정보',
      items: [
        { id: 'about', title: t('about') || '앱 정보', icon: 'information-circle-outline', action: 'navigate' },
        { id: 'terms', title: t('terms') || '이용약관', icon: 'document-text-outline', action: 'navigate' },
        { id: 'privacy_policy', title: t('privacyPolicy') || '개인정보처리방침', icon: 'shield-checkmark-outline', action: 'navigate' },
        { id: 'delete_account', title: t('deleteAccount') || '계정 삭제', icon: 'trash-outline', action: 'navigate' },
      ]
    }
  ];

  async function handleToggle(id, currentValue) {
    switch(id) {
      case 'notifications':
        setLoading(true);
        try {
          const newValue = !currentValue;
          
          // 알림 켜기 시 권한 요청
          if (newValue) {
            const hasPermission = await notificationService.requestPermissions();
            if (!hasPermission) {
              setLoading(false);
              return;
            }
            
            // 푸시 토큰 저장
            if (user?.id) {
              await notificationService.savePushToken(user.id);
            }
          }
          
          // AsyncStorage에 설정 저장
          try {
            await AsyncStorage.setItem('notifications_enabled', newValue.toString());
            setNotifications(newValue);
            logger.log('AsyncStorage 알림 설정 저장 성공:', newValue);
            
            // 푸시 토큰 저장
            if (newValue && user?.id) {
              await notificationService.savePushToken(user.id);
            }
            
            // 테스트 알림 전송
            if (newValue) {
              await notificationService.scheduleLocalNotification(
                '알림 활성화됨',
                'ARLD 알림이 활성화되었습니다.',
                { type: 'test' }
              );
            }
          } catch (storageError) {
            console.error('AsyncStorage 저장 실패:', storageError);
            Alert.alert('오류', '알림 설정을 변경할 수 없습니다.');
          }
        } catch (error) {
          Alert.alert('오류', '알림 설정 변경에 실패했습니다.');
        } finally {
          setLoading(false);
        }
        break;
        
    }
  };

  function handleLanguageSelect() {
    const languages = getAvailableLanguages();
    const options = languages.map(function(lang) { return ({
      text: lang.name,
      onPress: function() { changeLanguage(lang.code); }
    }); });
    
    options.push({ text: t('cancel') || '취소', style: 'cancel' });
    
    Alert.alert(
      t('selectLanguage') || '언어 선택',
      t('selectLanguageDescription') || '사용할 언어를 선택하세요',
      options
    );
  };

  function handleCountrySelect() {
    const countries = [
      { code: 'KR', name: '한국' },
      { code: 'JP', name: '일본' },
      { code: 'US', name: '미국' },
    ];
    
    const options = countries.map(function(country) { return ({
      text: country.name,
      onPress: function() { changeCountry(country.code); }
    }); });
    
    options.push({ text: '취소', style: 'cancel' });
    
    Alert.alert(
      '국가 선택',
      '사용할 국가를 선택하세요',
      options
    );
  };

  async function changeCountry(newCountry) {
    if (!user?.id || newCountry === userCountry) return;
    
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ country: newCountry })
        .eq('id', user.id);
      
      if (error) throw error;
      
      setUserCountry(newCountry);
      Alert.alert('완료', '국가가 변경되었습니다.');
    } catch (error) {
      console.error('국가 변경 오류:', error);
      Alert.alert('오류', '국가 변경에 실패했습니다.');
    }
  };

  async function handleNavigate(id) {
    switch(id) {
      case 'profile':
        navigation.navigate('ProfileEdit');
        break;
      case 'password':
        navigation.navigate('PasswordReset');
        break;
      case 'hidden_users':
        // 프리미엄 권한 체크 (만료일 포함)
        try {
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          if (!currentUser) {
            Alert.alert('오류', '로그인이 필요합니다.');
            return;
          }

          const accessResult = await checkPremiumAccess(currentUser.id);
          
          if (accessResult.isPremium || accessResult.isAdmin) {
            navigation.navigate('HiddenUsers');
          } else {
            const message = accessResult.isExpired 
              ? '구독이 만료되었습니다. 사용자 숨김 기능은 전문가 멤버십 전용 기능입니다.'
              : '사용자 숨김 기능은 전문가 멤버십 전용 기능입니다.';
            Alert.alert('전문가 멤버십 필요', message);
            navigation.navigate('Upgrade');
          }
        } catch (error) {
          console.error('프로필 조회 오류:', error);
          Alert.alert('오류', '권한을 확인할 수 없습니다.');
        }
        break;
      case 'delete_account':
        navigation.navigate('AccountDeletion');
        break;
      case 'terms':
        navigation.navigate('TermsOfService');
        break;
      case 'privacy_policy':
        navigation.navigate('PrivacyPolicy');
        break;
      default:
        Alert.alert(t('notification') || '알림', t('comingSoon') || '준비 중입니다.');
        break;
    }
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={function() { navigation.goBack(); }}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settings') || '설정'}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {settingsSections.map(function(section, sectionIndex) {
          return (
            <View key={sectionIndex} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              
              {section.items.map(function(item, itemIndex) {
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.settingItem,
                      itemIndex === section.items.length - 1 && styles.lastItem
                    ]}
                    onPress={function() {
                      if (item.action === 'navigate') {
                        handleNavigate(item.id);
                      } else if (item.action === 'language') {
                        handleLanguageSelect();
                      } else if (item.action === 'country') {
                        handleCountrySelect();
                      }
                    }}
                    disabled={item.action === 'toggle'}
                  >
                    <View style={styles.settingLeft}>
                      <Ionicons name={item.icon} size={24} color="#000000" />
                      <View style={styles.textContainer}>
                        <Text style={styles.settingText}>{item.title}</Text>
                        {item.subtitle && (
                          <Text style={styles.settingSubtext}>{item.subtitle}</Text>
                        )}
                      </View>
                    </View>
                    
                    {item.action === 'toggle' ? (
                      <Switch
                        value={item.value}
                        onValueChange={function() { handleToggle(item.id, item.value); }}
                        trackColor={{ false: '#767577', true: theme.colors.primary }}
                        thumbColor={'white'}
                      />
                    ) : (
                      <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}

        {/* 로그아웃 버튼 */}
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={function() {
            Alert.alert(
              t('logout') || '로그아웃',
              t('logoutConfirm') || '정말 로그아웃하시겠습니까?',
              [
                { text: t('cancel') || '취소', style: 'cancel' },
                { text: t('logout') || '로그아웃', style: 'destructive', onPress: function() {
                  // 로그아웃 로직
                  navigation.navigate('Login');
                }}
              ]
            );
          }}
        >
          <Text style={styles.logoutText}>{t('logout') || '로그아웃'}</Text>
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
    color: '#000000',
  },
  headerRight: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: 'white',
    borderBottomWidth: 0.5,
    borderBottomColor: theme.colors.border,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  textContainer: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  settingText: {
    ...theme.typography.body,
    fontSize: 14,
    color: '#000000',
  },
  settingSubtext: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  logoutButton: {
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.medium,
  },
  logoutText: {
    ...theme.typography.body,
    color: theme.colors.error,
    fontWeight: '600',
  },
  bottomSpace: {
    height: 50,
  },
});

