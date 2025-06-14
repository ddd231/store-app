import { Alert, Platform } from 'react-native';
import { 
  setNotificationHandler,
  getPermissionsAsync,
  requestPermissionsAsync,
  getExpoPushTokenAsync,
  scheduleNotificationAsync,
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
  removeNotificationSubscription,
  setBadgeCountAsync
} from 'expo-notifications';
import { isDevice } from 'expo-device';
import { supabase } from './supabaseClient';

// 알림 기본 설정
setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  constructor() {
    this.notificationListener = null;
    this.responseListener = null;
  }

  // 알림 권한 요청
  async requestPermissions() {
    if (!isDevice) {
      return false;
    }

    const { status: existingStatus } = await getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      Alert.alert('알림 권한', '알림을 받으려면 설정에서 권한을 허용해주세요.');
      return false;
    }

    return true;
  }

  // 푸시 토큰 가져오기
  async getPushToken() {
    if (!isDevice) {
      return null;
    }

    try {
      const token = await getExpoPushTokenAsync({
        projectId: 'your-project-id' // Expo 프로젝트 ID로 교체 필요
      });
      return token.data;
    } catch (error) {
      console.error('푸시 토큰 가져오기 실패:', error);
      return null;
    }
  }

  // 푸시 토큰 저장
  async savePushToken(userId) {
    try {
      const pushToken = await this.getPushToken();
      if (!pushToken) return;

      // user_profiles 테이블에 푸시 토큰 저장
      const { error } = await supabase
        .from('user_profiles')
        .update({ push_token: pushToken })
        .eq('id', userId);

      if (error) {
        console.error('푸시 토큰 저장 실패:', error);
      }
    } catch (error) {
      console.error('푸시 토큰 처리 오류:', error);
    }
  }

  // 로컬 알림 생성
  async scheduleLocalNotification(title, body, data = {}) {
    await scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: null, // 즉시 전송
    });
  }

  // 메시지 알림
  async sendMessageNotification(senderName, message, roomId) {
    await this.scheduleLocalNotification(
      senderName,
      message,
      { type: 'message', roomId }
    );
  }

  // 친구 요청 알림
  async sendFriendRequestNotification(requesterName) {
    await this.scheduleLocalNotification(
      '새로운 친구 요청',
      `${requesterName}님이 친구 요청을 보냈습니다.`,
      { type: 'friend_request' }
    );
  }

  // 작품 댓글 알림
  async sendCommentNotification(commenterName, workTitle) {
    await this.scheduleLocalNotification(
      '새로운 댓글',
      `${commenterName}님이 "${workTitle}"에 댓글을 남겼습니다.`,
      { type: 'comment' }
    );
  }

  // 알림 리스너 설정
  setupNotificationListeners(navigation) {
    // 알림 수신 리스너
    this.notificationListener = addNotificationReceivedListener(notification => {
    });

    // 알림 클릭 리스너
    this.responseListener = addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      
      // 알림 타입에 따라 화면 이동
      switch (data.type) {
        case 'message':
          navigation.navigate('Chat', { roomId: data.roomId });
          break;
        case 'friend_request':
          navigation.navigate('FriendsList', { tab: 'requests' });
          break;
        case 'comment':
          navigation.navigate('WorkDetail', { workId: data.workId });
          break;
      }
    });
  }

  // 리스너 정리
  removeNotificationListeners() {
    if (this.notificationListener) {
      removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      removeNotificationSubscription(this.responseListener);
    }
  }

  // 배지 숫자 설정
  async setBadgeCount(count) {
    if (Platform.OS === 'ios') {
      await setBadgeCountAsync(count);
    }
  }

  // 알림 설정 상태 가져오기
  async getNotificationSettings(userId) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('push_notifications_enabled, email_notifications_enabled')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data || { push_notifications_enabled: false, email_notifications_enabled: false }; // 기본값 false
    } catch (error) {
      console.error('알림 설정 가져오기 실패:', error);
      return { push_notifications_enabled: false, email_notifications_enabled: false }; // 기본값 false
    }
  }

  // 알림 설정 업데이트
  async updateNotificationSettings(userId, settings) {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(settings)
        .eq('id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('알림 설정 업데이트 실패:', error);
      return false;
    }
  }
}

export default new NotificationService();