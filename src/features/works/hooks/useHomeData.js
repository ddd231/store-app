import { useState, useEffect, useCallback } from 'react';
import { getWorks } from '../services/workService';

export function useHomeData() {
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // 작품 데이터 로드
  const loadWorks = useCallback(async function(isInitial = false) {
    try {
      if (!isInitial) {
        setCategoryLoading(true);
      }
      const data = await getWorks(selectedCategory);
      setArtworks(data);
    } catch (error) {
      console.error('작품 로드 오류:', error);
      setArtworks([]);
    } finally {
      if (isInitial) {
        setLoading(false);
      } else {
        setCategoryLoading(false);
      }
    }
  }, [selectedCategory]);

  // 새로고침
  const onRefresh = useCallback(async function() {
    setRefreshing(true);
    try {
      await loadWorks();
    } finally {
      setRefreshing(false);
    }
  }, [loadWorks]);

  // 카테고리 변경
  const changeCategory = useCallback(function(categoryId) {
    setSelectedCategory(categoryId);
  }, []);

  // 초기 로드
  useEffect(function() {
    loadWorks(true);
  }, []);

  // 카테고리 변경 시 로드
  useEffect(function() {
    if (selectedCategory) {
      loadWorks();
    }
  }, [selectedCategory, loadWorks]);

  return {
    artworks,
    loading,
    categoryLoading,
    refreshing,
    selectedCategory,
    loadWorks,
    onRefresh,
    changeCategory
  };
}