import { Platform } from 'react-native';
import Constants from 'expo-constants';

// 동적으로 서버 URL을 가져오는 함수
export const getServerUrl = () => {
  // 개발 환경에서 동적으로 호스트 가져오기
  if (__DEV__) {
    // 웹 환경
    if (Platform.OS === 'web') {
      // 현재 브라우저의 호스트를 사용
      const hostname = window.location.hostname;
      return `wss://${hostname}:8000`;
    }
    
    // 모바일 환경 (Android/iOS)
    // Expo Constants에서 디바이스 IP 가져오기
    const { manifest } = Constants;
    
    // Expo Go 앱에서 실행 중일 때
    if (manifest && manifest.debuggerHost) {
      const debuggerHost = manifest.debuggerHost.split(':')[0];
      return `wss://${debuggerHost}:8000`;
    }
    
    // manifest2 (SDK 48+)
    if (Constants.manifest2?.extra?.expoGo?.debuggerHost) {
      const debuggerHost = Constants.manifest2.extra.expoGo.debuggerHost.split(':')[0];
      return `wss://${debuggerHost}:8000`;
    }
    
    // expoConfig (최신 버전)
    if (Constants.expoConfig?.hostUri) {
      const hostUri = Constants.expoConfig.hostUri.split(':')[0];
      return `wss://${hostUri}:8000`;
    }
    
    // 폴백: localhost
    return 'wss://localhost:8000';
  }
  
  // 프로덕션 환경
  return 'wss://your-production-server.com:8000';
};

// 디버깅을 위한 네트워크 정보 출력 (개발 환경에서만)
export const logNetworkInfo = () => {
  if (!__DEV__) return;
  
  
  if (Platform.OS === 'web') {
  }
  
};