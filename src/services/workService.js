import { supabase, uploadFileToSupabase, getCurrentUserId } from './supabaseClient';

const WORKS_BUCKET = 'works';

/**
 * 이미지 파일을 업로드용 객체로 변환
 */
async function createUploadFile(uri) {
  try {
    // 웹 환경에서는 Blob 사용
    if (typeof window !== 'undefined') {
      const response = await fetch(uri);
      const blob = await response.blob();
      return blob;
    } else {
      // React Native에서는 파일 객체 직접 반환
      return {
        uri: uri,
        type: 'image/jpeg',
        name: 'photo.jpg'
      };
    }
  } catch (error) {
    console.error('파일 변환 오류:', error);
    console.error('URI:', uri);
    throw new Error('이미지 파일 변환에 실패했습니다.');
  }
}

/**
 * 파일명 생성 함수
 */
function generateFileName(originalName, userId, type) {
  const timestamp = Date.now();
  const extension = originalName.split('.').pop() || (type === 'painting' ? 'jpg' : 'txt');
  return `${type}/${userId}/${timestamp}.${extension}`;
}

/**
 * 그림 작품 업로드
 */
export async function uploadPaintingWork({ title, description, category, imageUri }) {
  try {
    
    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error('로그인이 필요합니다.');
    }
    
    // 사용자 프로필에서 이름 가져오기
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('username')
      .eq('id', userId)
      .single();
    
    const authorName = profile?.username || 'User';

    // 파일명 생성
    const fileName = generateFileName('image.jpg', userId, 'painting');
    
    // 이미지 업로드 (URI 직접 전달)
    const fileObj = {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'image.jpg'
    };
    const { publicUrl } = await uploadFileToSupabase(fileObj, WORKS_BUCKET, fileName);
    
    // 작품 데이터 저장
    const { data, error } = await supabase
      .from('works')
      .insert([
        {
          title: title.trim(),
          description: description.trim(),
          category: category.trim(),
          type: 'painting',
          image_url: publicUrl,
          author_id: userId,
          author_name: authorName,
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('작품 저장 오류:', error);
      throw new Error('작품 저장에 실패했습니다.');
    }

    return data;
  } catch (error) {
    console.error('그림 업로드 오류:', error);
    throw error;
  }
}

/**
 * 소설 작품 업로드
 */
export async function uploadNovelWork({ title, description, category, content }) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error('로그인이 필요합니다.');
    }
    
    // 사용자 프로필에서 이름 가져오기
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('username')
      .eq('id', userId)
      .single();
    
    const authorName = profile?.username || 'User';

    // 작품 데이터 저장
    const { data, error } = await supabase
      .from('works')
      .insert([
        {
          title: title.trim(),
          description: description.trim(),
          category: category.trim(),
          type: 'novel',
          content: content.trim(),
          author_id: userId,
          author_name: authorName,
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('작품 저장 오류:', error);
      throw new Error('작품 저장에 실패했습니다.');
    }

    return data;
  } catch (error) {
    console.error('소설 업로드 오류:', error);
    throw error;
  }
}

/**
 * 작품 목록 조회
 */
export async function getWorks(type = 'all', limit = 20, offset = 0) {
  try {
    // 사용자 인증 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('로그인이 필요합니다.');
    }

    let query = supabase
      .from('works')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (type !== 'all') {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) {
      console.error('작품 조회 오류:', error);
      throw new Error('작품을 불러올 수 없습니다.');
    }

    return data || [];
  } catch (error) {
    console.error('작품 목록 조회 오류:', error);
    throw error;
  }
}

/**
 * 특정 작품 조회
 */
export async function getWorkById(workId) {
  try {
    const { data, error } = await supabase
      .from('works')
      .select('*')
      .eq('id', workId)
      .single();

    if (error) {
      console.error('작품 상세 조회 오류:', error);
      throw new Error('작품을 찾을 수 없습니다.');
    }

    return data;
  } catch (error) {
    console.error('작품 상세 조회 오류:', error);
    throw error;
  }
}

/**
 * 작품 삭제
 */
export async function deleteWork(workId) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error('로그인이 필요합니다.');
    }

    const { error } = await supabase
      .from('works')
      .delete()
      .eq('id', workId)
      .eq('author_id', userId);

    if (error) {
      console.error('작품 삭제 오류:', error);
      throw new Error('작품 삭제에 실패했습니다.');
    }

    return true;
  } catch (error) {
    console.error('작품 삭제 오류:', error);
    throw error;
  }
}