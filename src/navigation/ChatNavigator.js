import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ChatListScreen from '../screens/ChatListScreen';
import ChatScreen from '../screens/ChatScreen';
import SelectFriendForChatScreen from '../screens/SelectFriendForChatScreen';
import { theme } from '../styles/theme';

const Stack = createStackNavigator();

export default function ChatNavigator() {
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
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.background,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
          height: 100,
        },
        headerTitleStyle: {
          ...theme.typography.body,
          fontWeight: '600',
          paddingTop: 5,
        },
        headerTintColor: theme.colors.text.primary,
        headerBackTitleVisible: false,
        headerLeftContainerStyle: {
          paddingTop: 5,
        },
        ...scaleAnimation,
      }}
    >
      <Stack.Screen 
        name="ChatList" 
        component={ChatListScreen}
        options={{
          title: '채팅',
          headerTitleAlign: 'center',
        }}
      />
      <Stack.Screen 
        name="Chat" 
        component={ChatScreen}
        options={({ route }) => ({
          title: route.params?.roomName || '채팅방',
          headerTitleAlign: 'center',
        })}
      />
      <Stack.Screen 
        name="SelectFriendForChat" 
        component={SelectFriendForChatScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}