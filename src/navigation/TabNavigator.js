import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { supabase } from '../services/supabaseClient';
import notificationService from '../services/notificationService';
import { useNavigation } from '@react-navigation/native';

// 임시 화면들 (나중에 실제 화면으로 교체)
import HomeScreen from '../screens/HomeScreen';
import ChatNavigator from './ChatNavigator';
import BoardScreen from '../screens/BoardScreen';
import ProfileScreen from '../screens/ProfileScreen';
import UpgradeScreen from '../screens/UpgradeScreen';
import WorkUploadScreen from '../screens/WorkUploadScreen';
import WorkTypeSelectScreen from '../screens/WorkTypeSelectScreen';
import WorkDetailScreen from '../screens/WorkDetailScreen';
import JobPostScreen from '../screens/JobPostScreen';
import JobDetailScreen from '../screens/JobDetailScreen';
import ContestDetailScreen from '../screens/ContestDetailScreen';
import BlogDetailScreen from '../screens/BlogDetailScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ProfileEditScreen from '../screens/ProfileEditScreen';
import FriendsListScreen from '../screens/FriendsListScreen';
import BookmarksScreen from '../screens/BookmarksScreen';
import HiddenUsersScreen from '../screens/HiddenUsersScreen';
import CreateGalleryScreen from '../screens/CreateGalleryScreen';
import GalleryDetailScreen from '../screens/GalleryDetailScreen';
import EditGalleryScreen from '../screens/EditGalleryScreen';
import EditWorkScreen from '../screens/EditWorkScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import TermsOfServiceScreen from '../screens/TermsOfServiceScreen';
import ViewHistoryScreen from '../screens/ViewHistoryScreen';
import AccountDeletionScreen from '../screens/AccountDeletionScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function MainTabs() {
  const [unreadCount, setUnreadCount] = useState(0);
  const navigation = useNavigation();

  useEffect(() => {
    // 알림 리스너 설정
    notificationService.setupNotificationListeners(navigation);
    
    return () => {
      // 알림 리스너 정리
      notificationService.removeNotificationListeners();
    };
  }, [navigation]);

  useEffect(() => {
    let subscription = null;
    
    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        subscription = supabase
          .channel('unread_messages')
          .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'messages' },
            () => loadUnreadCount()
          )
          .subscribe();
      }
    };

    loadUnreadCount();
    setupSubscription();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const loadUnreadCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setUnreadCount(0);
        return;
      }

      // 내가 참여한 채팅방들의 안 읽은 메시지 수 계산
      const { data: chatRooms, error: roomsError } = await supabase
        .from('chat_rooms')
        .select('id')
        .or(`creator_id.eq.${user.id},participant_id.eq.${user.id}`);

      if (roomsError || !chatRooms) {
        setUnreadCount(0);
        return;
      }

      const roomIds = chatRooms.map(room => room.id);
      
      if (roomIds.length === 0) {
        setUnreadCount(0);
        return;
      }

      // 각 채팅방의 안 읽은 메시지 수 계산
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('id, user_id, created_at')
        .in('chat_room_id', roomIds)
        .neq('user_id', user.id); // 내가 보낸 메시지 제외

      if (messagesError || !messages) {
        setUnreadCount(0);
        return;
      }

      // 실제로는 마지막 읽은 시간과 비교해야 하지만
      // 간단히 다른 사람이 보낸 메시지 수로 계산
      setUnreadCount(messages.length);
      
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
          height: 100,
          paddingBottom: 40,
          paddingTop: 2,
          position: 'absolute',
          bottom: 0,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.text.secondary,
        tabBarLabelStyle: {
          fontSize: 10,
          marginTop: 2,
          marginBottom: 2,
        },
        tabBarIconStyle: {
          marginTop: 4,
        }
      }}
    >
      <Tab.Screen 
        name="홈" 
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={26} color={color} />
          ),
        }}
      />
      
      <Tab.Screen 
        name="채팅" 
        component={ChatNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-outline" size={26} color={color} />
          ),
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
        name="공개" 
        component={BoardScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="newspaper-variant-outline" size={26} color={color} />
          ),
        }}
      />
      
      <Tab.Screen 
        name="내 프로필" 
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={26} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function TabNavigator() {
  // 공통 애니메이션 옵션
  const scaleAnimation = {
    cardStyleInterpolator: ({ current, next, closing }) => {
      // 닫을 때는 기본 애니메이션 사용
      if (closing) {
        return {};
      }
      
      // 열 때만 커스텀 애니메이션
      const scale = current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0.85, 1],
        extrapolate: 'clamp',
      });

      const translateY = current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [50, 0],
        extrapolate: 'clamp',
      });

      return {
        cardStyle: {
          transform: [
            {
              scale,
            },
            {
              translateY,
            },
          ],
        },
        overlayStyle: {
          opacity: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0.5],
            extrapolate: 'clamp',
          }),
        },
      };
    },
    gestureEnabled: true,
    gestureDirection: 'horizontal',
    cardOverlayEnabled: true,
    animationEnabled: true,
    transitionSpec: {
      open: {
        animation: 'spring',
        config: {
          stiffness: 1000,
          damping: 500,
          mass: 3,
          overshootClamping: true,
          restDisplacementThreshold: 0.01,
          restSpeedThreshold: 0.01,
        },
      },
      close: {
        animation: 'timing',
        config: {
          duration: 0,
        },
      },
    },
  };

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen 
        name="Upgrade" 
        component={UpgradeScreen}
        options={{
          presentation: 'modal'
        }}
      />
      <Stack.Screen 
        name="WorkTypeSelect" 
        component={WorkTypeSelectScreen}
        options={scaleAnimation}
      />
      <Stack.Screen 
        name="WorkUpload" 
        component={WorkUploadScreen}
        options={scaleAnimation}
      />
      <Stack.Screen 
        name="WorkDetail" 
        component={WorkDetailScreen}
        options={scaleAnimation}
      />
      <Stack.Screen 
        name="JobPost" 
        component={JobPostScreen}
        options={scaleAnimation}
      />
      <Stack.Screen 
        name="JobDetail" 
        component={JobDetailScreen}
        options={scaleAnimation}
      />
      <Stack.Screen 
        name="ContestDetail" 
        component={ContestDetailScreen}
        options={scaleAnimation}
      />
      <Stack.Screen 
        name="BlogDetail" 
        component={BlogDetailScreen}
        options={scaleAnimation}
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={scaleAnimation}
      />
      <Stack.Screen 
        name="ProfileEdit" 
        component={ProfileEditScreen}
        options={scaleAnimation}
      />
      <Stack.Screen 
        name="UserProfile" 
        component={ProfileScreen}
        options={scaleAnimation}
      />
      <Stack.Screen 
        name="FriendsList" 
        component={FriendsListScreen}
        options={scaleAnimation}
      />
      <Stack.Screen 
        name="Bookmarks" 
        component={BookmarksScreen}
        options={scaleAnimation}
      />
      <Stack.Screen 
        name="HiddenUsers" 
        component={HiddenUsersScreen}
        options={scaleAnimation}
      />
      <Stack.Screen 
        name="CreateGallery" 
        component={CreateGalleryScreen}
        options={scaleAnimation}
      />
      <Stack.Screen 
        name="GalleryDetail" 
        component={GalleryDetailScreen}
        options={scaleAnimation}
      />
      <Stack.Screen 
        name="EditGallery" 
        component={EditGalleryScreen}
        options={scaleAnimation}
      />
      <Stack.Screen 
        name="EditWork" 
        component={EditWorkScreen}
        options={scaleAnimation}
      />
      <Stack.Screen 
        name="ViewHistory" 
        component={ViewHistoryScreen}
        options={scaleAnimation}
      />
      <Stack.Screen 
        name="PrivacyPolicy" 
        component={PrivacyPolicyScreen}
        options={scaleAnimation}
      />
      <Stack.Screen 
        name="TermsOfService" 
        component={TermsOfServiceScreen}
        options={scaleAnimation}
      />
      <Stack.Screen 
        name="AccountDeletion" 
        component={AccountDeletionScreen}
        options={scaleAnimation}
      />
    </Stack.Navigator>
  );
}