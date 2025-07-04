import { supabase, uploadFileToSupabase, getCurrentUserId, RateLimitedActions } from '../../../shared';
import * as Localization from 'expo-localization';

const WORKS_BUCKET = 'works';


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
    logger.log('[uploadPaintingWork] Starting upload with:', { title, category, imageUri });
    
    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error('로그인이 필요합니다.');
    }

    // 작품 업로드 일일 제한 체크
    const rateLimit = RateLimitedActions.checkWorkUpload(userId);
    if (!rateLimit.allowed) {
      throw new Error(rateLimit.message || '하루 작품 업로드 제한(15개)을 초과했습니다.');
    }
    
    // 사용자 프로필에서 이름 정보 가져오기
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('username, country')
      .eq('id', userId)
      .single();
    
    const authorName = profile?.username || 'User';
    // 사용자 프로필의 country가 없으면 기기 설정에서 가져오기
    const userCountry = profile?.country || Localization.region || 'KR';

    // 파일명 생성 - URI에서 확장자 추출 시도
    const uriParts = imageUri.split('.');
    const extension = uriParts.length > 1 ? uriParts[uriParts.length - 1].toLowerCase() : 'jpg';
    const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const finalExtension = validExtensions.includes(extension) ? extension : 'jpg';
    
    const fileName = generateFileName(`image.${finalExtension}`, userId, 'painting');
    
    // 파일 타입 결정
    const mimeTypes = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp'
    };
    const mimeType = mimeTypes[finalExtension] || 'image/jpeg';
    
    // 이미지 업로드 (URI 직접 전달)
    const fileObj = {
      uri: imageUri,
      type: mimeType,
      name: `image.${finalExtension}`
    };
    logger.log('[uploadPaintingWork] Uploading file:', fileObj, 'to bucket:', WORKS_BUCKET, 'with path:', fileName);
    const { publicUrl } = await uploadFileToSupabase(fileObj, WORKS_BUCKET, fileName);
    logger.log('[uploadPaintingWork] Upload successful, publicUrl:', publicUrl);
    
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
          country: userCountry,
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

    // 작품 업로드 일일 제한 체크
    const rateLimit = RateLimitedActions.checkWorkUpload(userId);
    if (!rateLimit.allowed) {
      throw new Error(rateLimit.message || '하루 작품 업로드 제한(15개)을 초과했습니다.');
    }
    
    // 사용자 프로필에서 이름 정보 가져오기
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('username, country')
      .eq('id', userId)
      .single();
    
    const authorName = profile?.username || 'User';
    // 사용자 프로필의 country가 없으면 기기 설정에서 가져오기
    const userCountry = profile?.country || Localization.region || 'KR';

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
          country: userCountry,
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

    // 예시 데이터 추가
    const sampleWorks = [
      {
        id: 'sample_1',
        title: '달빛 아래의 비밀',
        content: `첫 번째 만남은 우연이었다. 

달빛이 창문을 통해 스며들던 그 밤, 나는 오래된 서재에서 한 권의 책을 발견했다. 표지에는 아무것도 쓰여있지 않았지만, 첫 페이지를 펼치는 순간 이상한 일이 일어났다.

글자들이 움직이기 시작한 것이다. 마치 살아있는 듯 페이지 위에서 춤을 추며 새로운 이야기를 만들어냈다. 그 순간 나는 깨달았다. 이것은 단순한 책이 아니라는 것을.`,
        type: 'novel',
        category: '판타지',
        author_id: 'sample_author_1',
        author_name: '김소설',
        created_at: new Date().toISOString(),
        image_url: null
      },
      {
        id: 'sample_2',
        title: '시간을 거슬러',
        content: `2045년, 시간여행이 가능해진 세상.

하지만 과거를 바꾸는 것은 여전히 금지되어 있었다. 나는 시간관리청의 요원으로 일하며 불법 시간여행자들을 추적하는 일을 했다.

어느 날, 내 앞에 나타난 의뢰인은 충격적인 사실을 털어놓았다. 그녀의 딸이 과거로 사라졌다는 것이다.`,
        type: 'novel',
        category: 'SF',
        author_id: 'sample_author_2',
        author_name: '박미래',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        image_url: null
      }
    ];

    return [...sampleWorks, ...(data || [])];
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