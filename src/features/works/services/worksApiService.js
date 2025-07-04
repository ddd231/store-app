/**
 * Works API Service Layer
 * WorksContext에서 분리된 순수 API 레이어
 */

import { supabase, uploadFileToSupabase, logger } from '../../../shared';

export class WorksApiService {
  /**
   * 작품 목록 조회
   */
  static async getWorks(category = 'all', username = null) {
    try {
      let query = supabase
        .from('works')
        .select(`
          *,
          user_profiles (
            username,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (category !== 'all') {
        query = query.eq('category', category);
      }

      if (username) {
        query = query.eq('user_profiles.username', username);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      logger.error('작품 조회 실패:', error);
      return { data: [], error: error.message };
    }
  }

  /**
   * 작품 생성
   */
  static async createWork(workData) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('로그인이 필요합니다');

      const { data, error } = await supabase
        .from('works')
        .insert([{
          ...workData,
          author_id: user.id,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      logger.error('작품 생성 실패:', error);
      return { data: null, error: error.message };
    }
  }

  /**
   * 소설 업로드
   */
  static async uploadNovel(title, content, description, genre) {
    try {
      const workData = {
        title,
        content,
        description,
        genre,
        category: 'novel',
        file_url: null
      };

      return await this.createWork(workData);
    } catch (error) {
      logger.error('소설 업로드 실패:', error);
      return { data: null, error: error.message };
    }
  }

  /**
   * 그림 업로드
   */
  static async uploadPainting(title, description, genre, file) {
    try {
      if (!file) throw new Error('파일이 필요합니다');

      // 파일 업로드
      const fileUploadResult = await uploadFileToSupabase(file, 'artworks');
      if (fileUploadResult.error) {
        throw new Error(fileUploadResult.error);
      }

      const workData = {
        title,
        description,
        genre,
        category: 'painting',
        file_url: fileUploadResult.publicUrl,
        content: null
      };

      return await this.createWork(workData);
    } catch (error) {
      logger.error('그림 업로드 실패:', error);
      return { data: null, error: error.message };
    }
  }

  /**
   * 작품 삭제
   */
  static async deleteWork(workId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('로그인이 필요합니다');

      const { error } = await supabase
        .from('works')
        .delete()
        .eq('id', workId)
        .eq('author_id', user.id); // 본인 작품만 삭제 가능

      if (error) throw error;
      return { success: true, error: null };
    } catch (error) {
      logger.error('작품 삭제 실패:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 북마크 토글
   */
  static async toggleBookmark(workId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('로그인이 필요합니다');

      // 기존 북마크 확인
      const { data: existing } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('user_id', user.id)
        .eq('work_id', workId)
        .single();

      if (existing) {
        // 북마크 제거
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('id', existing.id);

        if (error) throw error;
        return { bookmarked: false, error: null };
      } else {
        // 북마크 추가
        const { error } = await supabase
          .from('bookmarks')
          .insert([{
            user_id: user.id,
            work_id: workId,
            created_at: new Date().toISOString()
          }]);

        if (error) throw error;
        return { bookmarked: true, error: null };
      }
    } catch (error) {
      logger.error('북마크 토글 실패:', error);
      return { bookmarked: false, error: error.message };
    }
  }

  /**
   * 북마크된 작품들 조회
   */
  static async getBookmarkedWorks() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('로그인이 필요합니다');

      const { data, error } = await supabase
        .from('bookmarks')
        .select(`
          work_id,
          works (
            *,
            user_profiles (
              username,
              avatar_url
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const works = data.map(function(bookmark) { return bookmark.works; }).filter(Boolean);
      return { data: works, error: null };
    } catch (error) {
      logger.error('북마크 작품 조회 실패:', error);
      return { data: [], error: error.message };
    }
  }
}