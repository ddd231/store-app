import { useState } from 'react';
import { Alert } from 'react-native';

export function useProfileMenu(handleHideUser) {
  const [userMenuVisible, setUserMenuVisible] = useState(false);

  function handleUserMenuPress(action) {
    setUserMenuVisible(false);
    
    switch (action) {
      case 'hide':
        Alert.alert(
          '사용자 숨김',
          '이 사용자를 숨기시겠습니까?\n숨긴 사용자는 검색 결과나 추천에서 제외됩니다.',
          [
            { text: '취소', style: 'cancel' },
            { text: '숨김', style: 'destructive', onPress: handleHideUser }
          ]
        );
        break;
      case 'report':
        Alert.alert('신고', '이 기능은 준비 중입니다.');
        break;
      case 'block':
        Alert.alert('차단', '이 기능은 준비 중입니다.');
        break;
    }
  }

  return {
    userMenuVisible,
    setUserMenuVisible,
    handleUserMenuPress
  };
}