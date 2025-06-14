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
import { theme } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { checkPremiumAccess } from '../utils/premiumUtils';
import notificationService from '../services/notificationService';
import { useAuth } from '../hooks/useAuth';

export default function SettingsScreen({ navigation }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState(false); // 기본값 false로 변경
  const [publicProfile, setPublicProfile] = useState(true);
  const [loading, setLoading] = useState(false);

  // 알림 설정 불러오기
  useEffect(() => {
    loadNotificationSettings();
  }, []);

  const loadNotificationSettings = async () => {
    if (!user?.id) return;
    
    const settings = await notificationService.getNotificationSettings(user.id);
    setNotifications(settings.push_notifications_enabled);
  };

  const settingsSections = [
    {
      title: '계정',
      items: [
        { id: 'profile', title: '프로필 편집', icon: 'person-outline', action: 'navigate' },
        { id: 'password', title: '비밀번호 변경', icon: 'lock-closed-outline', action: 'navigate' },
        { id: 'delete_account', title: '계정 삭제', icon: 'trash-outline', action: 'navigate' },
      ]
    },
    {
      title: '알림',
      items: [
        { id: 'notifications', title: '푸시 알림', icon: 'notifications-outline', action: 'toggle', value: notifications },
        { id: 'email_notifications', title: '이메일 알림', icon: 'mail-outline', action: 'navigate' },
      ]
    },
    {
      title: '개인정보',
      items: [
        { id: 'public_profile', title: '공개 프로필', icon: 'eye-outline', action: 'toggle', value: publicProfile },
        { id: 'hidden_users', title: '숨긴사용자 관리', icon: 'eye-off-outline', action: 'navigate' },
        { id: 'data', title: '데이터 관리', icon: 'server-outline', action: 'navigate' },
      ]
    },
    {
      title: '일반',
      items: [
        { id: 'language', title: '언어', icon: 'language-outline', action: 'navigate', subtitle: '한국어' },
      ]
    },
    {
      title: '정보',
      items: [
        { id: 'about', title: '앱 정보', icon: 'information-circle-outline', action: 'navigate' },
        { id: 'terms', title: '이용약관', icon: 'document-text-outline', action: 'navigate' },
        { id: 'privacy', title: '개인정보처리방침', icon: 'shield-checkmark-outline', action: 'navigate' },
        { id: 'help', title: '도움말', icon: 'help-circle-outline', action: 'navigate' },
      ]
    }
  ];

  const handleToggle = async (id, currentValue) => {
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
          
          // 설정 저장
          if (user?.id) {
            const success = await notificationService.updateNotificationSettings(user.id, {
              push_notifications_enabled: newValue
            });
            
            if (success) {
              setNotifications(newValue);
              
              // 테스트 알림 전송
              if (newValue) {
                await notificationService.scheduleLocalNotification(
                  '알림 활성화됨',
                  'ARLD 알림이 활성화되었습니다.',
                  { type: 'test' }
                );
              }
            }
          }
        } catch (error) {
          Alert.alert('오류', '알림 설정 변경에 실패했습니다.');
        } finally {
          setLoading(false);
        }
        break;
        
      case 'public_profile':
        setPublicProfile(!currentValue);
        break;
    }
  };

  const handleNavigate = async (id) => {
    switch(id) {
      case 'hidden_users':
        const hasAccess = await checkPremiumAccess(navigation, '사용자 숨김 기능');
        if (hasAccess) {
          navigation.navigate('HiddenUsers');
        }
        break;
      case 'delete_account':
        navigation.navigate('AccountDeletion');
        break;
      default:
        Alert.alert('알림', '준비 중입니다.');
        break;
    }
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>설정</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            
            {section.items.map((item, itemIndex) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.settingItem,
                  itemIndex === section.items.length - 1 && styles.lastItem
                ]}
                onPress={() => {
                  if (item.action === 'navigate') {
                    handleNavigate(item.id);
                  }
                }}
                disabled={item.action === 'toggle'}
              >
                <View style={styles.settingLeft}>
                  <Ionicons name={item.icon} size={24} color={theme.colors.text.primary} />
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
                    onValueChange={() => handleToggle(item.id, item.value)}
                    trackColor={{ false: '#767577', true: theme.colors.primary }}
                    thumbColor={'white'}
                  />
                ) : (
                  <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* 로그아웃 버튼 */}
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={() => {
            Alert.alert(
              '로그아웃',
              '정말 로그아웃하시겠습니까?',
              [
                { text: '취소', style: 'cancel' },
                { text: '로그아웃', style: 'destructive', onPress: () => {
                  // 로그아웃 로직
                  navigation.navigate('Login');
                }}
              ]
            );
          }}
        >
          <Text style={styles.logoutText}>로그아웃</Text>
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
    color: theme.colors.text.primary,
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
    color: theme.colors.text.primary,
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