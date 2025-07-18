import 'react-native-gesture-handler';
import './hermesPolyfill'; // Hermes 호환성 polyfill
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, StyleSheet, Platform, Text, Alert } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
let NavigationBar;
try {
  NavigationBar = require('expo-navigation-bar');
} catch (error) {
  console.log('[App] expo-navigation-bar 모듈 로드 실패:', error);
}
import { SafeAreaProvider } from 'react-native-safe-area-context';

// pointerEvents 경고는 LogBox로 처리하는 것이 더 안전함

// Screens
import LoginScreen from './src/features/auth/screens/LoginScreen';
import PasswordResetScreen from './src/features/auth/screens/PasswordResetScreen';
import TabNavigator from './src/navigation/TabNavigator';
import StoreScreen from './src/screens/StoreScreen';

// Zustand Store
import { useAuthStore } from './src/store/authStore';

// React Query
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './src/shared/services/queryClient';

// Services
import notificationService from './src/services/notificationService';

// Subscription check utility
async function checkExpiredSubscriptions() {
  try {
    console.log('[App] 구독 만료 체크 시작...');
    const { supabase } = await import('./src/shared/index.js');
    
    const { data, error } = await supabase.functions.invoke('subscription-manager', {
      body: { action: 'check_expiry' }
    });

    if (error) {
      console.warn('[App] 구독 만료 체크 실패:', error);
    } else {
      console.log('[App] 구독 만료 체크 완료:', data);
    }
  } catch (error) {
    console.warn('[App] 구독 만료 체크 오류:', error);
  }
}

// Contexts
import { LanguageProvider } from './src/contexts/LanguageContext';

// IAP Context - 완전히 비활성화 (개발 중)
const withIAPContext = function(Component) { 
  return Component; 
};

// AdMob 초기화 (모바일에서만)
let mobileAds;
try {
  if (Platform.OS !== 'web') {
    const adModule = require('react-native-google-mobile-ads');
    mobileAds = adModule?.default || adModule;
  }
} catch (error) {
  // AdMob 모듈 로드 실패 시 무시하고 계속 진행
  mobileAds = null;
}

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

function App() {
  if (__DEV__) {
    console.log('[App] App 컴포넌트 렌더링 시작');
  }
  
  const [isAppReady, setIsAppReady] = useState(false);
  
  const [expiredLinkDetected, setExpiredLinkDetected] = useState(false);
  
  // 비밀번호 재설정 페이지인지 먼저 확인
  const isPasswordResetPage = () => {
    if (typeof window !== 'undefined' && window.location && window.location.hash) {
      const hash = window.location.hash;
      const isReset = hash.includes('type=recovery');
      const hasError = hash.includes('error=access_denied') || hash.includes('error_code=otp_expired');
      
      if (__DEV__) {
        console.log('[App] 비밀번호 재설정 페이지 확인:', isReset, 'hasError:', hasError, hash);
      }
      
      // 오류가 있으면 URL 정리하고 일반 모드로
      if (hasError) {
        if (__DEV__) {
          console.log('[App] 만료된 링크 감지 - URL 정리 후 일반 모드로 전환');
        }
        if (window.history && window.history.replaceState) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
        setExpiredLinkDetected(true);
        return false;
      }
      
      return isReset;
    }
    if (__DEV__) {
      console.log('[App] 일반 앱 모드');
    }
    return false;
  };

  // 비밀번호 재설정 페이지면 useAuth를 사용하지 않고 바로 렌더링
  if (isPasswordResetPage()) {
    if (__DEV__) {
      console.log('[App] 비밀번호 재설정 페이지 렌더링');
    }
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="PasswordReset" component={PasswordResetScreen} />
          </Stack.Navigator>
          <StatusBar style="light" />
        </NavigationContainer>
      </GestureHandlerRootView>
    );
  }

  // Zustand store 사용
  const { user, loading, initialize, setupAuthListener } = useAuthStore();
  
  useEffect(() => {
    // 인증 초기화
    initialize();
    
    // 인증 상태 변경 리스너 설정
    const subscription = setupAuthListener();
    
    return () => {
      subscription?.unsubscribe();
    };
  }, [initialize, setupAuthListener]);

  // 앱 초기화 및 로고 표시
  useEffect(() => {
    const initializeApp = async () => {
      // 실제 로딩 작업들
      if (Platform.OS !== 'web') {
        // AdMob 초기화 대기
        if (mobileAds && typeof mobileAds.initialize === 'function') {
          try {
            await mobileAds.initialize();
          } catch (error) {
            console.log('AdMob 초기화 실패:', error);
          }
        }
        
        // NavigationBar 설정 대기
        if (NavigationBar) {
          try {
            await NavigationBar.setBackgroundColorAsync('#F5F1E8');
            await NavigationBar.setButtonStyleAsync('dark');
          } catch (error) {
            console.log('NavigationBar 설정 실패:', error);
          }
        }
        
        // 구독 만료 체크 (백그라운드에서 실행)
        checkExpiredSubscriptions();
      }
      
      // 최소 2초간 로고 표시
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsAppReady(true);
    };
    
    initializeApp();
  }, []);

  // AdMob 초기화 및 NavigationBar 색상 설정
  useEffect(() => {
    if (Platform.OS !== 'web') {
      // AdMob 초기화
      if (mobileAds && typeof mobileAds.initialize === 'function') {
        try {
          mobileAds.initialize().then(() => {
            if (__DEV__) {
              console.log('[App] AdMob SDK 초기화 완료');
            }
          }).catch((error) => {
            if (__DEV__) {
              console.log('[App] AdMob SDK 초기화 실패:', error);
            }
          });
        } catch (error) {
          if (__DEV__) {
            console.log('[App] AdMob 초기화 호출 실패:', error);
          }
        }
      }
      
      // NavigationBar 색상 설정
      if (Platform.OS === 'android' && NavigationBar) {
        try {
          if (NavigationBar.setBackgroundColorAsync) {
            NavigationBar.setBackgroundColorAsync('#F5F1E8').catch((error) => {
              if (__DEV__) {
                console.log('[App] NavigationBar 배경색 설정 실패:', error);
              }
            });
          }
          if (NavigationBar.setButtonStyleAsync) {
            NavigationBar.setButtonStyleAsync('dark').catch((error) => {
              if (__DEV__) {
                console.log('[App] NavigationBar 버튼 스타일 설정 실패:', error);
              }
            });
          }
        } catch (error) {
          if (__DEV__) {
            console.log('[App] NavigationBar API 호출 실패:', error);
          }
        }
      }
    }
  }, []);


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

  // 앱 시작 시 로고 표시
  if (!isAppReady) {
    return (
      <View style={styles.splashContainer}>
        <Text style={styles.splashText}>ARLD</Text>
      </View>
    );
  }

  if (loading) {
    if (__DEV__) {
      console.log('[App] 로딩 중...');
    }
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <SafeAreaProvider>
            <NavigationContainer>
              {user ? (
                <AppStack />
              ) : (
                <Stack.Navigator screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="Login" component={LoginScreen} />
                </Stack.Navigator>
              )}
              <StatusBar style="light" />
            </NavigationContainer>
          </SafeAreaProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F1E8',
  },
  splashText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#000000',
    letterSpacing: -1,
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
    marginTop: -50,
  },
});

export default withIAPContext(App);