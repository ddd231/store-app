import { supabase } from '../../../shared';

// 블로그 목록 조회
export async function getBlogPosts(status = 'published', limit = 20, offset = 0) {
  try {
    let query = supabase
      .from('blog_posts')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.error('블로그 조회 오류:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('getBlogPosts 오류:', error);
    throw error;
  }
};

// 블로그 글 생성
export async function createBlogPost(blogData) {
  try {
    // 현재 사용자 정보 가져오기
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('로그인이 필요합니다.');
    }

    // 사용자 프로필 정보 가져오기
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('username')
      .eq('id', user.id)
      .single();

    const authorName = profile?.username || 'User';

    // 태그 문자열을 배열로 변환
    const tags = blogData.tags ? 
      blogData.tags.split(',').map(function(tag) { return tag.trim(); }).filter(function(tag) { return tag.length > 0; }) : 
      [];

    const { data, error } = await supabase
      .from('blog_posts')
      .insert([
        {
          title: blogData.title,
          content: blogData.content,
          excerpt: blogData.excerpt || blogData.content.substring(0, 200) + '...',
          author_id: user.id,
          author_name: authorName,
          tags: tags,
          status: 'published',
          read_time: calculateReadTime(blogData.content)
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('블로그 생성 오류:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('createBlogPost 오류:', error);
    throw error;
  }
};

// 블로그 글 수정
export async function updateBlogPost(id, blogData) {
  try {
    // 태그 문자열을 배열로 변환
    const tags = blogData.tags ? 
      blogData.tags.split(',').map(function(tag) { return tag.trim(); }).filter(function(tag) { return tag.length > 0; }) : 
      [];

    const { data, error } = await supabase
      .from('blog_posts')
      .update({
        title: blogData.title,
        content: blogData.content,
        excerpt: blogData.excerpt || blogData.content.substring(0, 200) + '...',
        tags: tags,
        read_time: calculateReadTime(blogData.content),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('블로그 수정 오류:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('updateBlogPost 오류:', error);
    throw error;
  }
};

// 블로그 글 삭제
export async function deleteBlogPost(id) {
  try {
    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('블로그 삭제 오류:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('deleteBlogPost 오류:', error);
    throw error;
  }
};

// 특정 블로그 글 조회
export async function getBlogPost(id) {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('블로그 조회 오류:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('getBlogPost 오류:', error);
    throw error;
  }
};

// 사용자의 블로그 목록 조회
export async function getUserBlogPosts(userId) {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('author_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('사용자 블로그 조회 오류:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('getUserBlogPosts 오류:', error);
    throw error;
  }
};

// 블로그 상태 변경 (발행/비공개)
export async function updateBlogPostStatus(id, status) {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .update({ 
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('블로그 상태 변경 오류:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('updateBlogPostStatus 오류:', error);
    throw error;
  }
};

// 조회수 증가
export async function incrementBlogViewCount(id) {
  try {
    const { error } = await supabase.rpc('increment_blog_views', { blog_id: id });

    if (error) {
      console.error('조회수 증가 오류:', error);
      // 조회수 증가 실패는 중요하지 않으므로 에러를 던지지 않음
    }
  } catch (error) {
    console.error('incrementBlogViewCount 오류:', error);
  }
};

// 읽기 시간 계산 (대략적인 추정)
function calculateReadTime(content) {
  const wordsPerMinute = 200; // 분당 평균 읽기 단어 수
  const words = content.split(/\s+/).length;
  const readTime = Math.ceil(words / wordsPerMinute);
  return readTime;
}

// 인기 블로그 조회
export async function getPopularBlogPosts(limit = 10) {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('status', 'published')
      .order('view_count', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('인기 블로그 조회 오류:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('getPopularBlogPosts 오류:', error);
    throw error;
  }
};

// 태그별 블로그 조회
export async function getBlogPostsByTag(tag, limit = 20) {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .contains('tags', [tag])
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('태그별 블로그 조회 오류:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('getBlogPostsByTag 오류:', error);
    throw error;
  }
};