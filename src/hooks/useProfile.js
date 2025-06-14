import { useState, useEffect } from 'react';
import { supabase } from '../services/api/client';

/**
 * 프로필 데이터를 관리하는 커스텀 훅
 */
export function useProfile(userId) {
  const [profile, setProfile] = useState(null);
  const [works, setWorks] = useState([]);
  const [galleries, setGalleries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (userId) {
      loadProfile();
    }
  }, [userId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      // 프로필 정보 가져오기
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // 작품 목록 가져오기
      const { data: worksData, error: worksError } = await supabase
        .from('works')
        .select('*')
        .eq('author_id', userId)
        .order('created_at', { ascending: false });

      if (worksError) throw worksError;
      setWorks(worksData || []);

      // 갤러리 목록 가져오기
      const { data: galleriesData, error: galleriesError } = await supabase
        .from('galleries')
        .select('*')
        .eq('creator_id', userId)
        .order('created_at', { ascending: false });

      if (galleriesError) throw galleriesError;
      setGalleries(galleriesData || []);

    } catch (err) {
      console.error('Profile loading error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates) => {
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
      console.error('Profile update error:', err);
      return { success: false, error: err.message };
    }
  };

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