import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getWorks } from '../services/workService';
import { supabase, logger } from '../../../shared';

// 쿼리 키 상수
export const WORKS_QUERY_KEYS = {
  all: ['works'],
  lists: function() { return [...WORKS_QUERY_KEYS.all, 'list']; },
  list: function(filters) { return [...WORKS_QUERY_KEYS.lists(), filters]; },
  details: function() { return [...WORKS_QUERY_KEYS.all, 'detail']; },
  detail: function(id) { return [...WORKS_QUERY_KEYS.details(), id]; },
};

// 작품 목록 조회 훅
export function useWorksQuery(filters = {}) {
  return useQuery({
    queryKey: WORKS_QUERY_KEYS.list(filters),
    queryFn: function() { return getWorks(filters); },
    staleTime: 2 * 60 * 1000, // 2분
    cacheTime: 5 * 60 * 1000, // 5분
    select: function(data) {
      // 데이터 변환/필터링
      if (!data) return [];
      
      return data.map(function(work) { return ({
        ...work,
        // 클라이언트 사이드 데이터 정규화
        author_name: work.author_name || 'Unknown Author',
        category: work.category || 'Uncategorized',
        created_at: new Date(work.created_at),
      }); });
    },
    onError: function(error) {
      logger.error('작품 목록 조회 실패:', error);
    },
  });
};

// 단일 작품 조회 훅
export function useWorkQuery(workId) {
  return useQuery({
    queryKey: WORKS_QUERY_KEYS.detail(workId),
    queryFn: async function() {
      const { data, error } = await supabase
        .from('works')
        .select('*')
        .eq('id', workId)
        .single();
        
      if (error) throw error;
      return data;
    },
    enabled: !!workId,
    staleTime: 5 * 60 * 1000, // 5분
    onError: function(error) {
      logger.error('작품 상세 조회 실패:', error);
    },
  });
};

// 작품 생성 뮤테이션
export function useCreateWorkMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async function(workData) {
      const { data, error } = await supabase
        .from('works')
        .insert(workData)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: function(data) {
      // 작품 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: WORKS_QUERY_KEYS.lists()
      });
      
      // 새 작품을 캐시에 추가
      queryClient.setQueryData(
        WORKS_QUERY_KEYS.detail(data.id),
        data
      );
      
      logger.info('작품 생성 성공:', data);
    },
    onError: function(error) {
      logger.error('작품 생성 실패:', error);
    },
  });
};

// 작품 수정 뮤테이션
export function useUpdateWorkMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async function({ workId, updates }) {
      const { data, error } = await supabase
        .from('works')
        .update(updates)
        .eq('id', workId)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: function(data, { workId }) {
      // 특정 작품 캐시 업데이트
      queryClient.setQueryData(
        WORKS_QUERY_KEYS.detail(workId),
        data
      );
      
      // 작품 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: WORKS_QUERY_KEYS.lists()
      });
      
      logger.info('작품 수정 성공:', data);
    },
    onError: function(error) {
      logger.error('작품 수정 실패:', error);
    },
  });
};

// 작품 삭제 뮤테이션
export function useDeleteWorkMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async function(workId) {
      const { error } = await supabase
        .from('works')
        .delete()
        .eq('id', workId);
        
      if (error) throw error;
      return workId;
    },
    onSuccess: function(workId) {
      // 삭제된 작품 캐시 제거
      queryClient.removeQueries({
        queryKey: WORKS_QUERY_KEYS.detail(workId)
      });
      
      // 작품 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: WORKS_QUERY_KEYS.lists()
      });
      
      logger.info('작품 삭제 성공:', workId);
    },
    onError: function(error) {
      logger.error('작품 삭제 실패:', error);
    },
  });
};

// 북마크 토글 뮤테이션
export function useToggleBookmarkMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async function({ workId, userId }) {
      // 현재 북마크 상태 확인
      const { data: existing } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('work_id', workId)
        .eq('user_id', userId)
        .single();
        
      if (existing) {
        // 북마크 제거
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('id', existing.id);
          
        if (error) throw error;
        return { workId, bookmarked: false };
      } else {
        // 북마크 추가
        const { error } = await supabase
          .from('bookmarks')
          .insert({ work_id: workId, user_id: userId });
          
        if (error) throw error;
        return { workId, bookmarked: true };
      }
    },
    onSuccess: function({ workId, bookmarked }) {
      // 작품 상세 캐시 업데이트
      queryClient.setQueryData(
        WORKS_QUERY_KEYS.detail(workId),
        function(oldData) { return oldData ? { ...oldData, is_bookmarked: bookmarked } : oldData; }
      );
      
      logger.info('북마크 토글 성공:', { workId, bookmarked });
    },
    onError: function(error) {
      logger.error('북마크 토글 실패:', error);
    },
  });
};