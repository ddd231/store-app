import { supabase } from '../services/supabaseClient';
import { Alert } from 'react-native';

/**
 * 현재 사용자의 프리미엄 상태를 확인
 * @returns {Promise<boolean>} 프리미엄 사용자 여부
 */
export const checkUserPremiumStatus = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_premium, premium_expires_at')
      .eq('id', user.id)
      .single();

    if (!profile) return false;

    // 프리미엄이 아니면 false
    if (!profile.is_premium) return false;

    // 만료일이 있고 만료되었으면 false
    if (profile.premium_expires_at) {
      const expiresAt = new Date(profile.premium_expires_at);
      const now = new Date();
      if (now > expiresAt) {
        // 만료된 경우 is_premium을 false로 업데이트
        await supabase
          .from('user_profiles')
          .update({ is_premium: false })
          .eq('id', user.id);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('프리미엄 상태 확인 오류:', error);
    return false;
  }
};

/**
 * 프리미엄 기능 접근 시 체크하고 업그레이드 안내
 * @param {Object} navigation - React Navigation 객체
 * @param {string} featureName - 기능 이름 (알림에 표시)
 * @returns {Promise<boolean>} 접근 허용 여부
 */
export const checkPremiumAccess = async (navigation, featureName = '이 기능') => {
  const isPremium = await checkUserPremiumStatus();
  
  if (!isPremium) {
    Alert.alert(
      '전문가 멤버십 필요',
      `${featureName}은 전문가 멤버십 전용 기능입니다. 업그레이드하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '업그레이드',
          onPress: () => navigation.navigate('Upgrade')
        }
      ]
    );
    return false;
  }
  
  return true;
};

/**
 * 사용자를 프리미엄으로 업그레이드
 * @param {number} months - 구독 개월 수 (기본 1개월)
 * @returns {Promise<boolean>} 성공 여부
 */
export const upgradeToPremium = async (months = 1) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + months);

    const { error } = await supabase
      .from('user_profiles')
      .update({
        is_premium: true,
        premium_expires_at: expiresAt.toISOString()
      })
      .eq('id', user.id);

    if (error) {
      console.error('프리미엄 업그레이드 오류:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('프리미엄 업그레이드 오류:', error);
    return false;
  }
};