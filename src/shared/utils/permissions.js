import { supabase } from '../services/supabase/client';

/**
 * 개발자 권한 확인
 * @param {Object} user - 사용자 객체
 * @returns {boolean} 개발자 여부
 */
export function checkIsDeveloper(user) {
  if (!user) return false;
  
  const developerEmails = ['lsg5235@gmail.com'];
  
  return developerEmails.includes(user.email) || 
         user.user_metadata?.role === 'developer' ||
         user.user_metadata?.role === 'admin';
};

/**
 * 편집 권한 확인 (개발자 또는 작성자)
 * @param {Object} user - 사용자 객체
 * @param {string} authorId - 작성자 ID
 * @returns {boolean} 편집 가능 여부
 */
export function checkCanEdit(user, authorId) {
  if (!user) return false;
  
  const isDeveloper = checkIsDeveloper(user);
  const isAuthor = user.id === authorId;
  
  return isDeveloper || isAuthor;
};

/**
 * 현재 사용자의 개발자 권한 확인
 * @returns {Promise<boolean>} 개발자 여부
 */
export async function checkCurrentUserIsDeveloper() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return checkIsDeveloper(user);
  } catch (error) {
    console.error('개발자 권한 확인 오류:', error);
    return false;
  }
};