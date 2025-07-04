import { useState } from 'react';
import { Alert } from 'react-native';
import { supabase, notificationService } from '../../../shared';
import { useLanguage } from '../../../contexts/LanguageContext';

export function useProfileActions(currentUser, viewingUserId, viewingUserName, navigation) {
  const { t } = useLanguage();
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);

  function handleQRCode() {
    setQrModalVisible(true);
  }

  async function handleAddFriend() {
    try {
      if (!currentUser) {
        alert(t('loginRequired'));
        return;
      }

      const { data: existingFriend } = await supabase
        .from('friends')
        .select('id, status')
        .eq('user_id', currentUser.id)
        .eq('friend_id', viewingUserId)
        .single();

      if (existingFriend) {
        if (existingFriend.status === 'accepted') {
          alert(t('alreadyFriends'));
        } else if (existingFriend.status === 'pending') {
          alert(t('friendRequestSent'));
        }
        return;
      }
      
      const { data, error } = await supabase
        .from('friends')
        .insert([
          {
            user_id: currentUser.id,
            friend_id: viewingUserId,
            status: 'pending'
          }
        ])
        .select();

      if (error) {
        console.error('친구 추가 오류:', error);
        alert(t('addFriendFailed'));
      } else {
        await notificationService.scheduleLocalNotification(
          t('friendRequestSentTitle'),
          `${viewingUserName || t('user')}${t('language') === 'ko' ? '님에게' : ' '} ${t('friendRequestSuccess')}`,
          { type: 'friend_request_sent' }
        );
        
        alert(t('friendRequestSuccess'));
      }
    } catch (error) {
      console.error('친구 추가 오류:', error);
      alert(t('addFriendFailed'));
    }
  }

  async function handleHideUser() {
    try {
      if (!currentUser || !viewingUserId) return;

      const { error } = await supabase
        .from('hidden_users')
        .insert([
          {
            user_id: currentUser.id,
            hidden_user_id: viewingUserId,
            created_at: new Date().toISOString()
          }
        ]);

      if (error) {
        console.error('사용자 숨김 오류:', error);
        Alert.alert('오류', '사용자 숨김에 실패했습니다.');
      } else {
        Alert.alert(
          '사용자 숨김 완료',
          '이 사용자가 숨김 처리되었습니다.\n설정 > 숨긴사용자 관리에서 확인할 수 있습니다.',
          [
            {
              text: '확인',
              onPress: function() {
                navigation.goBack();
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('사용자 숨김 오류:', error);
      Alert.alert('오류', '사용자 숨김에 실패했습니다.');
    }
  }

  return {
    qrModalVisible,
    setQrModalVisible,
    uploadModalVisible,
    setUploadModalVisible,
    handleQRCode,
    handleAddFriend,
    handleHideUser
  };
}