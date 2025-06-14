import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, StyleSheet, Platform, Text, Alert } from 'react-native';

// 웹에서 pointerEvents 경고 억제 (간단한 방법)
if (Platform.OS === 'web' && typeof console !== 'undefined') {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    if (args[0] && typeof args[0] === 'string' && 
        (args[0].includes('pointerEvents is deprecated') || 
         args[0].includes('Use style.pointerEvents'))) {
      return; // pointerEvents 경고 무시
    }
    originalWarn.apply(console, args);
  };
}

// Screens
import LoginScreen from './src/screens/LoginScreen';
import PasswordResetScreen from './src/screens/PasswordResetScreen';
import TabNavigator from './src/navigation/TabNavigator';
import StoreScreen from './src/screens/StoreScreen';

// Hooks
import { useAuth } from './src/hooks/useAuth';

// Services
import notificationService from './src/services/notificationService';

const Stack = createStackNavigator();

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}

function AppStack() {
  return <TabNavigator />;
}

export default function App() {
  console.log('[App] App 컴포넌트 렌더링 시작');
  
  const [expiredLinkDetected, setExpiredLinkDetected] = useState(false);
  
  // 비밀번호 재설정 페이지인지 먼저 확인
  const isPasswordResetPage = () => {
    if (typeof window !== 'undefined' && window.location && window.location.hash) {
      const hash = window.location.hash;
      const isReset = hash.includes('type=recovery');
      const hasError = hash.includes('error=access_denied') || hash.includes('error_code=otp_expired');
      
      console.log('[App] 비밀번호 재설정 페이지 확인:', isReset, 'hasError:', hasError, hash);
      
      // 오류가 있으면 URL 정리하고 일반 모드로
      if (hasError) {
        console.log('[App] 만료된 링크 감지 - URL 정리 후 일반 모드로 전환');
        if (window.history && window.history.replaceState) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
        setExpiredLinkDetected(true);
        return false;
      }
      
      return isReset;
    }
    console.log('[App] 일반 앱 모드');
    return false;
  };

  // 비밀번호 재설정 페이지면 useAuth를 사용하지 않고 바로 렌더링
  if (isPasswordResetPage()) {
    console.log('[App] 비밀번호 재설정 페이지 렌더링');
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="PasswordReset" component={PasswordResetScreen} />
        </Stack.Navigator>
        <StatusBar style="light" />
      </NavigationContainer>
    );
  }

  // 모바일에서만 useAuth 호출
  const { user, loading } = useAuth();
  
  const [authUser, setAuthUser] = useState(null);

  useEffect(() => {
    console.log('[App] user 변경됨:', user?.id);
    if (user) {
      setAuthUser(user);
    }
  }, [user]);

  const handleLoginSuccess = async (userData) => {
    console.log('[App] 로그인 성공:', userData?.id);
    setAuthUser(userData);
    
    // 로그인 성공 시에는 알림 권한 요청하지 않음 (사용자가 설정에서 켜야 함)
    // if (userData?.id) {
    //   const hasPermission = await notificationService.requestPermissions();
    //   if (hasPermission) {
    //     await notificationService.savePushToken(userData.id);
    //   }
    // }
  };

  // 만료된 링크 알림
  useEffect(() => {
    if (expiredLinkDetected) {
      setTimeout(() => {
        Alert.alert(
          '링크 만료',
          '비밀번호 재설정 링크가 만료되었습니다.\n\n새로운 재설정 이메일을 요청해주세요.',
          [{ text: '확인' }]
        );
      }, 500);
    }
  }, [expiredLinkDetected]);

  if (loading) {
    console.log('[App] 로딩 중...');
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 10, color: '#666' }}>로딩 중...</Text>
      </View>
    );
  }

  // 웹에서는 간단한 테스트 화면
  if (Platform.OS === 'web') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <Text style={{ fontSize: 24, color: '#000' }}>ARLD STORE</Text>
        <Text style={{ fontSize: 16, color: '#666', marginTop: 10 }}>스토어가 곧 오픈됩니다</Text>
      </View>
    );
  }

  // 모바일 앱은 기존 로직 그대로
  return (
    <NavigationContainer>
      {authUser ? (
        <AppStack />
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login">
            {(props) => (
              <LoginScreen {...props} onLoginSuccess={handleLoginSuccess} />
            )}
          </Stack.Screen>
        </Stack.Navigator>
      )}
      <StatusBar style="light" />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});