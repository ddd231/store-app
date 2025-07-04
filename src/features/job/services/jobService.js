import { supabase } from '../../../shared';

// 채용공고 목록 조회
export async function getJobPosts(status = 'active') {
  try {
    const { data, error } = await supabase
      .from('job_posts')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('채용공고 조회 오류:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('getJobPosts 오류:', error);
    throw error;
  }
};

// 채용공고 생성
export async function createJobPost(jobData) {
  try {
    // 현재 사용자 정보 가져오기
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('로그인이 필요합니다.');
    }

    // Rate Limit 체크
    const { RateLimitedActions } = await import('../utils/rateLimiter');
    const rateLimitResult = RateLimitedActions.checkJobPost(user.id);
    
    if (!rateLimitResult.allowed) {
      throw new Error('하루에 채용공고는 5번까지만 올릴 수 있습니다.');
    }

    // 태그 문자열을 배열로 변환
    const tags = jobData.tags ? 
      jobData.tags.split(',').map(function(tag) { return tag.trim(); }).filter(function(tag) { return tag.length > 0; }) : 
      [];

    const { data, error } = await supabase
      .from('job_posts')
      .insert([
        {
          title: jobData.title,
          company: jobData.company,
          location: jobData.location,
          description: jobData.description,
          requirements: jobData.requirements || null,
          benefits: jobData.benefits || null,
          contact_email: jobData.contactEmail,
          tags: tags,
          author_id: user.id,
          status: 'active'
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('채용공고 생성 오류:', error);
      throw error;
    }


    return data;
  } catch (error) {
    console.error('createJobPost 오류:', error);
    throw error;
  }
};

// 채용공고 수정
export async function updateJobPost(id, jobData) {
  try {
    // 태그 문자열을 배열로 변환
    const tags = jobData.tags ? 
      jobData.tags.split(',').map(function(tag) { return tag.trim(); }).filter(function(tag) { return tag.length > 0; }) : 
      [];

    const { data, error } = await supabase
      .from('job_posts')
      .update({
        title: jobData.title,
        company: jobData.company,
        location: jobData.location,
        description: jobData.description,
        requirements: jobData.requirements || null,
        benefits: jobData.benefits || null,
        contact_email: jobData.contactEmail,
        tags: tags,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('채용공고 수정 오류:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('updateJobPost 오류:', error);
    throw error;
  }
};

// 채용공고 삭제
export async function deleteJobPost(id) {
  try {
    const { error } = await supabase
      .from('job_posts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('채용공고 삭제 오류:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('deleteJobPost 오류:', error);
    throw error;
  }
};

// 채용공고 상태 변경 (활성화/비활성화)
export async function updateJobPostStatus(id, status) {
  try {
    const { data, error } = await supabase
      .from('job_posts')
      .update({ 
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('채용공고 상태 변경 오류:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('updateJobPostStatus 오류:', error);
    throw error;
  }
};

// 특정 채용공고 조회
export async function getJobPost(id) {
  try {
    const { data, error } = await supabase
      .from('job_posts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('채용공고 조회 오류:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('getJobPost 오류:', error);
    throw error;
  }
};

// 사용자의 채용공고 목록 조회
export async function getUserJobPosts(userId) {
  try {
    const { data, error } = await supabase
      .from('job_posts')
      .select('*')
      .eq('author_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('사용자 채용공고 조회 오류:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('getUserJobPosts 오류:', error);
    throw error;
  }
};