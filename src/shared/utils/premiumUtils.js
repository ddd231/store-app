import { supabase } from '../index.js';

/**
 * 프리미엄 권한 실시간 체크 (만료일 포함)
 * @param {string} userId - 사용자 ID
 * @returns {Promise<{isPremium: boolean, isAdmin: boolean, isExpired: boolean, profile: object}>}
 */
export async function checkPremiumAccess(userId) {
  try {
    // 🔥 임시 우회: 모든 사용자를 프리미엄으로 처리 (개발/테스트용)
    // TODO: 실제 배포 시 이 부분을 제거해야 함
    if (userId) {
      console.log('🎯 [PremiumCheck] 임시 우회 모드 - 모든 사용자 프리미엄 처리');
      return { isPremium: true, isAdmin: false, isExpired: false, profile: { id: userId } };
    }
    
    if (!userId) {
      return { isPremium: false, isAdmin: false, isExpired: false, profile: null };
    }

    // 현재 사용자 정보 조회
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    
    if (!currentUser || currentUser.id !== userId) {
      return { isPremium: false, isAdmin: false, isExpired: false, profile: null };
    }

    // 프로필 조회
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      console.error('프로필 조회 실패:', error);
      return { isPremium: false, isAdmin: false, isExpired: false, profile: null };
    }

    // 관리자 체크
    const isAdmin = profile.is_admin || currentUser.email === 'lsg5235@gmail.com';

    // 만료일 체크
    const now = new Date();
    const expiryDate = profile.premium_expires_at ? new Date(profile.premium_expires_at) : null;
    const isExpired = expiryDate ? expiryDate < now : false;
    
    // 실제 프리미엄 상태 (만료되지 않았고 is_premium이 true인 경우)
    const isPremium = profile.is_premium && !isExpired;

    console.log('🎯 [PremiumCheck]', {
      userId,
      is_premium_db: profile.is_premium,
      premium_expires_at: profile.premium_expires_at,
      isExpired,
      isPremium,
      isAdmin
    });

    // 만료된 경우 서버에서 상태 업데이트 요청
    if (profile.is_premium && isExpired) {
      console.log('🎯 [PremiumCheck] 만료된 프리미엄 감지 - 서버 업데이트 요청');
      try {
        await supabase.functions.invoke('subscription-manager', {
          body: { action: 'check_expiry' }
        });
      } catch (updateError) {
        console.warn('만료 상태 업데이트 실패:', updateError);
      }
    }

    return {
      isPremium,
      isAdmin,
      isExpired,
      profile,
      daysRemaining: expiryDate && !isExpired ? Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0
    };

  } catch (error) {
    console.error('프리미엄 권한 체크 오류:', error);
    return { isPremium: false, isAdmin: false, isExpired: false, profile: null };
  }
}

/**
 * 레거시 호환성을 위한 함수 (기존 코드와의 호환성)
 * @param {object} user - 사용자 객체
 * @returns {Promise<boolean>}
 */
export async function checkPremiumOrAdminAccess(user) {
  if (!user?.id) return false;
  
  const result = await checkPremiumAccess(user.id);
  return result.isPremium || result.isAdmin;
}