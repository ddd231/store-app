import { Platform } from 'react-native';
import Constants from 'expo-constants';

// 동적으로 서버 URL을 가져오는 함수
export function getServerUrl() {
  // Supabase Realtime 사용하므로 별도 WebSocket URL 불필요
  // supabase.channel() 사용하면 자동 연결됨
  return null;
};

// 디버깅을 위한 네트워크 정보 출력
export function logNetworkInfo() {
  // Production에서는 아무것도 하지 않음
  return;
};