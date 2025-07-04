import { supabase } from '../../../shared';

// 컨테스트 목록 조회
export async function getContests(status = 'active', limit = 20, offset = 0) {
  try {
    let query = supabase
      .from('contests')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.error('컨테스트 조회 오류:', error);
      throw error;
    }


    return data;
  } catch (error) {
    console.error('getContests 오류:', error);
    throw error;
  }
};

// 컨테스트 생성
export async function createContest(contestData) {
  try {
    // 현재 사용자 정보 가져오기
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('로그인이 필요합니다.');
    }

    // Rate Limit 체크
    const { RateLimitedActions } = await import('../utils/rateLimiter');
    const rateLimitResult = RateLimitedActions.checkContestPost(user.id);
    
    if (!rateLimitResult.allowed) {
      throw new Error('하루에 컨테스트는 2번까지만 올릴 수 있습니다.');
    }

    // 사용자 프로필 정보 가져오기
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('username')
      .eq('id', user.id)
      .single();

    const organizerName = profile?.username || 'User';

    // 태그 문자열을 배열로 변환
    const tags = contestData.tags ? 
      contestData.tags.split(',').map(function(tag) { return tag.trim(); }).filter(function(tag) { return tag.length > 0; }) : 
      [];

    const { data, error } = await supabase
      .from('contests')
      .insert([
        {
          title: contestData.title,
          description: contestData.description,
          organizer: contestData.organizer || organizerName,
          start_date: contestData.startDate,
          end_date: contestData.endDate,
          prize: contestData.prize,
          requirements: contestData.requirements || null,
          submission_guidelines: contestData.submissionGuidelines || null,
          contact_email: contestData.contactEmail,
          tags: tags,
          author_id: user.id,
          organizer_name: organizerName,
          status: 'active'
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('컨테스트 생성 오류:', error);
      throw error;
    }


    return data;
  } catch (error) {
    console.error('createContest 오류:', error);
    throw error;
  }
};

// 컨테스트 수정
export async function updateContest(id, contestData) {
  try {
    // 태그 문자열을 배열로 변환
    const tags = contestData.tags ? 
      contestData.tags.split(',').map(function(tag) { return tag.trim(); }).filter(function(tag) { return tag.length > 0; }) : 
      [];

    const { data, error } = await supabase
      .from('contests')
      .update({
        title: contestData.title,
        description: contestData.description,
        organizer: contestData.organizer,
        start_date: contestData.startDate,
        end_date: contestData.endDate,
        prize: contestData.prize,
        requirements: contestData.requirements || null,
        submission_guidelines: contestData.submissionGuidelines || null,
        contact_email: contestData.contactEmail,
        tags: tags,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('컨테스트 수정 오류:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('updateContest 오류:', error);
    throw error;
  }
};

// 컨테스트 삭제
export async function deleteContest(id) {
  try {
    const { error } = await supabase
      .from('contests')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('컨테스트 삭제 오류:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('deleteContest 오류:', error);
    throw error;
  }
};

// 특정 컨테스트 조회
export async function getContest(id) {
  try {
    const { data, error } = await supabase
      .from('contests')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('컨테스트 조회 오류:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('getContest 오류:', error);
    throw error;
  }
};

// 사용자의 컨테스트 목록 조회
export async function getUserContests(userId) {
  try {
    const { data, error } = await supabase
      .from('contests')
      .select('*')
      .eq('author_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('사용자 컨테스트 조회 오류:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('getUserContests 오류:', error);
    throw error;
  }
};

// 컨테스트 상태 변경
export async function updateContestStatus(id, status) {
  try {
    const { data, error } = await supabase
      .from('contests')
      .update({ 
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('컨테스트 상태 변경 오류:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('updateContestStatus 오류:', error);
    throw error;
  }
};

// 컨테스트 참가자 수 조회
export async function getContestParticipants(contestId) {
  try {
    const { data, error } = await supabase
      .from('contest_participants')
      .select('*')
      .eq('contest_id', contestId);

    if (error) {
      console.error('컨테스트 참가자 조회 오류:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('getContestParticipants 오류:', error);
    throw error;
  }
};

// 컨테스트 참가 신청
export async function joinContest(contestId) {
  try {
    // 현재 사용자 정보 가져오기
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('로그인이 필요합니다.');
    }

    // 이미 참가했는지 확인
    const { data: existingParticipant } = await supabase
      .from('contest_participants')
      .select('id')
      .eq('contest_id', contestId)
      .eq('user_id', user.id)
      .single();

    if (existingParticipant) {
      throw new Error('이미 참가한 컨테스트입니다.');
    }

    const { data, error } = await supabase
      .from('contest_participants')
      .insert([
        {
          contest_id: contestId,
          user_id: user.id,
          joined_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('컨테스트 참가 오류:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('joinContest 오류:', error);
    throw error;
  }
};

// 컨테스트 참가 취소
export async function leaveContest(contestId) {
  try {
    // 현재 사용자 정보 가져오기
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('로그인이 필요합니다.');
    }

    const { error } = await supabase
      .from('contest_participants')
      .delete()
      .eq('contest_id', contestId)
      .eq('user_id', user.id);

    if (error) {
      console.error('컨테스트 참가 취소 오류:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('leaveContest 오류:', error);
    throw error;
  }
};

// 진행 중인 컨테스트 조회
export async function getActiveContests(limit = 10) {
  try {
    const currentDate = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('contests')
      .select('*')
      .eq('status', 'active')
      .gte('end_date', currentDate)
      .order('end_date', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('진행 중인 컨테스트 조회 오류:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('getActiveContests 오류:', error);
    throw error;
  }
};

// 종료된 컨테스트 조회
export async function getCompletedContests(limit = 10) {
  try {
    const currentDate = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('contests')
      .select('*')
      .eq('status', 'completed')
      .lt('end_date', currentDate)
      .order('end_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('종료된 컨테스트 조회 오류:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('getCompletedContests 오류:', error);
    throw error;
  }
};

// 태그별 컨테스트 조회
export async function getContestsByTag(tag, limit = 20) {
  try {
    const { data, error } = await supabase
      .from('contests')
      .select('*')
      .contains('tags', [tag])
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('태그별 컨테스트 조회 오류:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('getContestsByTag 오류:', error);
    throw error;
  }
};

// 컨테스트 조회수 증가
export async function incrementContestViewCount(id) {
  try {
    const { error } = await supabase.rpc('increment_contest_views', { contest_id: id });

    if (error) {
      console.error('조회수 증가 오류:', error);
      // 조회수 증가 실패는 중요하지 않으므로 에러를 던지지 않음
    }
  } catch (error) {
    console.error('incrementContestViewCount 오류:', error);
  }
};

