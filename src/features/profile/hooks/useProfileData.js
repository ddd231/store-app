import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../shared';
import { useLanguage } from '../../../contexts/LanguageContext';

export function useProfileData(viewingUserId) {
  const { t } = useLanguage();
  const [myWorks, setMyWorks] = useState([]);
  const [myGalleries, setMyGalleries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(true);

  const profileStats = useMemo(function() {
    const totalWorks = myWorks.length;
    const novelCount = myWorks.filter(function(work) { return work.type === 'novel'; }).length;
    const paintingCount = myWorks.filter(function(work) { return work.type === 'painting'; }).length;
    return [
      { label: t('artwork'), value: totalWorks.toString() },
      { label: t('novel'), value: novelCount.toString() },
      { label: t('painting'), value: paintingCount.toString() }
    ];
  }, [myWorks, t]);

  async function checkCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
    
    if (viewingUserId && user) {
      const isOwn = viewingUserId === user.id;
      setIsOwnProfile(isOwn);
    } else if (!viewingUserId) {
      setIsOwnProfile(true);
    }
  }

  async function loadUserAndWorksForUser(isOwnProfileParam) {
    try {
      setLoading(true);
      const targetUserId = viewingUserId || currentUser?.id;
      
      if (targetUserId) {
        if (isOwnProfileParam) {
          setUser(currentUser);
        } else {
          setUser({ id: targetUserId });
        }
        
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', targetUserId)
          .single();
        
        if (!profileError && profile) {
          setUserProfile(profile);
        }
        
        const { data: works, error } = await supabase
          .from('works')
          .select('*')
          .eq('author_id', targetUserId)
          .order('created_at', { ascending: false });
        
        if (!error) {
          setMyWorks(works || []);
        } else {
          console.error('Profile works error:', error);
        }

        const { data: galleries, error: galleriesError } = await supabase
          .from('galleries')
          .select('*')
          .eq('creator_id', targetUserId)
          .order('created_at', { ascending: false });

        if (!galleriesError) {
          setMyGalleries(galleries || []);
        } else {
          console.error('Profile galleries error:', galleriesError);
        }
      }
    } catch (error) {
      console.error('작품 로딩 오류:', error);
    } finally {
      setLoading(false);
    }
  }

  return {
    myWorks,
    myGalleries,
    loading,
    user,
    userProfile,
    currentUser,
    isOwnProfile,
    profileStats,
    checkCurrentUser,
    loadUserAndWorksForUser
  };
}