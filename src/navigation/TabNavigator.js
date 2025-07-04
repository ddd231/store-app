import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { supabase } from '../shared';
import { useNavigation } from '@react-navigation/native';
import notificationService from '../services/notificationService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../contexts/LanguageContext';

// Feature-based imports
import { HomeScreen } from '../features/works';
import ChatNavigator from './ChatNavigator';
import BoardScreen from '../screens/BoardScreen';
import { ProfileScreen, ProfileEditScreen, FriendsListScreen } from '../features/profile';
import { UpgradeScreen, BookmarksScreen } from '../features/premium';
import { WorkUploadScreen, WorkTypeSelectScreen, WorkDetailScreen, EditWorkScreen } from '../features/works';
import { JobPostScreen, JobDetailScreen, JobEditScreen } from '../features/job';
import { ContestDetailScreen, ContestEditScreen } from '../features/contest';
import { BlogDetailScreen, BlogEditScreen } from '../features/blog';
import { CreateGalleryScreen, GalleryDetailScreen, EditGalleryScreen } from '../features/gallery';
import SettingsScreen from '../screens/SettingsScreen';
import HiddenUsersScreen from '../screens/HiddenUsersScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import TermsOfServiceScreen from '../screens/TermsOfServiceScreen';
import ViewHistoryScreen from '../screens/ViewHistoryScreen';
import AccountDeletionScreen from '../screens/AccountDeletionScreen';
import { PasswordResetScreen } from '../features/auth';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function MainTabs() {
  const [unreadCount, setUnreadCount] = useState(0);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();

  useEffect(function() {
    // 알림 리스너 설정
    notificationService.setupNotificationListeners(navigation);
    
    return function() {
      // 알림 리스너 정리
      notificationService.removeNotificationListeners();
    };
  }, [navigation]);

  useEffect(function() {
    let subscription = null;
    
    async function setupSubscription() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        subscription = supabase
          .channel('unread_messages')
          .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'messages' },
            function() { loadUnreadCount(); }
          )
          .subscribe();
      }
    };

    loadUnreadCount();
    setupSubscription();

    return function() {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  async function loadUnreadCount() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setUnreadCount(0);
        return;
      }

      // 간단하게 0으로 설정 (성능 개선)
      setUnreadCount(0);
      
    } catch (error) {
      console.error('안 읽은 메시지 수 로드 오류:', error);
      setUnreadCount(0);
    }
  };

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
          borderTopWidth: 0.5,
          elevation: 0,
          shadowOpacity: 0,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 4,
          position: 'absolute',
          bottom: 0,
        },
        tabBarActiveTintColor: '#000000',
        tabBarInactiveTintColor: '#000000',
        tabBarLabelStyle: {
          fontSize: 10,
          marginTop: 0,
          marginBottom: 4,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
        tabBarButton: function(props) {
          return <TouchableOpacity {...props} activeOpacity={1} />;
        }
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          title: t('home'),
          tabBarLabel: t('home'),
          tabBarIcon: function({ color, size, focused }) { return (
            <Ionicons name={focused ? "home" : "home-outline"} size={26} color={color} />
          ); },
        }}
      />
      
      <Tab.Screen 
        name="Chat" 
        component={ChatNavigator}
        options={{
          title: t('chat'),
          tabBarLabel: t('chat'),
          tabBarIcon: function({ color, size, focused }) { return (
            <Ionicons name={focused ? "chatbubble" : "chatbubble-outline"} size={26} color={color} />
          ); },
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: theme.colors.primary,
            fontSize: 12,
            minWidth: 20,
            minHeight: 20,
            borderRadius: 10,
            paddingHorizontal: 4,
          }
        }}
      />
      
      <Tab.Screen 
        name="Board" 
        component={BoardScreen}
        options={{
          title: t('board'),
          tabBarLabel: t('board'),
          tabBarIcon: function({ color, size, focused }) { return (
            <MaterialCommunityIcons name={focused ? "newspaper-variant" : "newspaper-variant-outline"} size={26} color={color} />
          ); },
        }}
      />
      
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          title: t('profile'),
          tabBarLabel: t('profile'),
          tabBarIcon: function({ color, size, focused }) { return (
            <Ionicons name={focused ? "person" : "person-outline"} size={26} color={color} />
          ); },
        }}
      />
    </Tab.Navigator>
  );
}

function TabNavigator() {

  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        animationEnabled: true,
        cardStyleInterpolator: function({ current }) { return {
          cardStyle: {
            opacity: current.progress,
          },
        }; },
        transitionSpec: {
          open: {
            animation: 'timing',
            config: {
              duration: 200,
            },
          },
          close: {
            animation: 'timing',
            config: {
              duration: 200,
            },
          },
        },
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen 
        name="Upgrade" 
        component={UpgradeScreen}
        options={{
          presentation: 'modal'
        }}
      />
      <Stack.Screen name="WorkTypeSelect" component={WorkTypeSelectScreen} />
      <Stack.Screen name="WorkUpload" component={WorkUploadScreen} />
      <Stack.Screen name="WorkDetail" component={WorkDetailScreen} />
      <Stack.Screen name="JobPost" component={JobPostScreen} />
      <Stack.Screen name="JobDetail" component={JobDetailScreen} />
      <Stack.Screen name="ContestDetail" component={ContestDetailScreen} />
      <Stack.Screen name="BlogDetail" component={BlogDetailScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} />
      <Stack.Screen name="UserProfile" component={ProfileScreen} />
      <Stack.Screen name="FriendsList" component={FriendsListScreen} />
      <Stack.Screen name="Bookmarks" component={BookmarksScreen} />
      <Stack.Screen name="HiddenUsers" component={HiddenUsersScreen} />
      <Stack.Screen name="CreateGallery" component={CreateGalleryScreen} />
      <Stack.Screen name="GalleryDetail" component={GalleryDetailScreen} />
      <Stack.Screen name="EditGallery" component={EditGalleryScreen} />
      <Stack.Screen name="EditWork" component={EditWorkScreen} />
      <Stack.Screen name="ContestEdit" component={ContestEditScreen} />
      <Stack.Screen name="BlogEdit" component={BlogEditScreen} />
      <Stack.Screen name="JobEdit" component={JobEditScreen} />
      <Stack.Screen name="ViewHistory" component={ViewHistoryScreen} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
      <Stack.Screen name="AccountDeletion" component={AccountDeletionScreen} />
      <Stack.Screen name="PasswordReset" component={PasswordResetScreen} />
    </Stack.Navigator>
  );
};

export default TabNavigator;