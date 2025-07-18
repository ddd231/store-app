import { useState, useMemo } from 'react';
import { useDebounce } from '../../../shared';

export function useHomeSearch(artworks) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('latest'); // latest, oldest, random

  // 검색어 디바운싱 (500ms 지연)
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // 검색 필터링 (디바운싱된 검색어 사용)
  const filteredArtworks = useMemo(function() {
    if (!debouncedSearchQuery.trim()) return artworks;
    const query = debouncedSearchQuery.toLowerCase();
    return artworks.filter(function(work) {
      return work.title?.toLowerCase().includes(query) ||
        work.description?.toLowerCase().includes(query) ||
        work.category?.toLowerCase().includes(query);
    });
  }, [artworks, debouncedSearchQuery]);

  // 정렬 (최적화 - 랜덤 정렬 안정화)
  const sortedArtworks = useMemo(function() {
    const toSort = [...filteredArtworks];
    
    switch (sortBy) {
      case 'latest':
        return toSort.sort(function(a, b) { return new Date(b.created_at) - new Date(a.created_at); });
      case 'oldest':
        return toSort.sort(function(a, b) { return new Date(a.created_at) - new Date(b.created_at); });
      case 'random':
        // 안정적인 랜덤 정렬을 위해 ID를 시드로 사용
        return toSort.sort(function(a, b) {
          const seedA = parseInt(a.id?.toString().slice(-3) || '0', 10);
          const seedB = parseInt(b.id?.toString().slice(-3) || '0', 10);
          return seedA - seedB;
        });
      default:
        return toSort;
    }
  }, [filteredArtworks, sortBy]);

  return {
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    debouncedSearchQuery,
    filteredArtworks,
    sortedArtworks
  };
}