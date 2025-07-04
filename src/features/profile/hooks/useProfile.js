import { useState, useEffect, useCallback } from 'react';
import { supabase, logger } from '../../../shared';

/**
 * 프로필 데이터를 관리하는 커스텀 훅
 */
export function useProfile(userId) {
  const [profile, setProfile] = useState(null);
  const [works, setWorks] = useState([]);
  const [galleries, setGalleries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(function() {
    if (userId) {
      loadProfile();
    }
  }, [userId, loadProfile]);

  const loadProfile = useCallback(async function() {
    try {
      setLoading(true);
      setError(null);

      // 병렬로 모든 데이터 가져오기 (성능 개선)
      const [profileResult, worksResult, galleriesResult] = await Promise.allSettled([
        supabase
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .single(),
        supabase
          .from('works')
          .select('*')
          .eq('author_id', userId)
          .order('created_at', { ascending: false }),
        supabase
          .from('galleries')
          .select('*')
          .eq('creator_id', userId)
          .order('created_at', { ascending: false })
      ]);

      // 프로필 결과 처리
      if (profileResult.status === 'fulfilled' && !profileResult.value.error) {
        setProfile(profileResult.value.data);
      } else {
        logger.error('프로필 로드 실패:', profileResult.reason || profileResult.value.error);
      }

      // 작품 결과 처리
      if (worksResult.status === 'fulfilled' && !worksResult.value.error) {
        setWorks(worksResult.value.data || []);
      } else {
        logger.error('작품 로드 실패:', worksResult.reason || worksResult.value.error);
        setWorks([]);
      }

      // 갤러리 결과 처리
      if (galleriesResult.status === 'fulfilled' && !galleriesResult.value.error) {
        setGalleries(galleriesResult.value.data || []);
      } else {
        logger.error('갤러리 로드 실패:', galleriesResult.reason || galleriesResult.value.error);
        setGalleries([]);
      }

    } catch (err) {
      logger.error('프로필 로딩 오류:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const updateProfile = useCallback(async function(updates) {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: userId,
          ...updates,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      await loadProfile(); // 업데이트 후 새로고침
      return { success: true };
    } catch (err) {
      logger.error('프로필 업데이트 오류:', err);
      return { success: false, error: err.message };
    }
  }, [userId, loadProfile]);

  return {
    profile,
    works,
    galleries,
    loading,
    error,
    refresh: loadProfile,
    updateProfile,
  };
}