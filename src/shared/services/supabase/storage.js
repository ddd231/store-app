/**
 * Supabase Storage 관련 기능
 */

import { supabase } from './client';
import { isWeb } from './config';

/**
 * 지정된 버킷이 존재하는지 확인하고, 없으면 생성합니다.
 * @param {string} bucketName - 확인/생성할 버킷 이름
 * @returns {Promise<boolean>} - 성공 여부
 */
export async function ensureBucketExists(bucketName) {
  if (!bucketName) throw new Error('버킷 이름이 필요합니다');
  
  try {
    // 버킷이 존재하는지 확인
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('버킷 목록 조회 오류:', listError);
      throw listError;
    }
    
    // 버킷이 존재하는지 확인
    const bucketExists = buckets.some(function(bucket) { return bucket.name === bucketName; });
    
    // 버킷이 없으면 생성
    if (!bucketExists) {
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 10485760, // 10MB
      });
      
      if (createError) {
        console.error('버킷 생성 오류:', createError);
        throw createError;
      }
      
    } else {
    }
    
    return true;
  } catch (error) {
    console.error('버킷 확인/생성 중 오류:', error);
    throw error;
  }
}

/**
 * Supabase Storage에 파일을 업로드합니다.
 * @param {File|Blob} file - 업로드할 파일 객체
 * @param {string} bucketName - 업로드할 버킷 이름
 * @param {string} path - 업로드 경로 (파일명 포함)
 * @returns {Promise<{publicUrl: string}>} - 업로드된 파일의 공개 URL
 */
export async function uploadFileToSupabase(file, bucketName, path) {
  if (!bucketName || !path || !file) {
    throw new Error('버킷 이름, 경로 및 파일이 필요합니다');
  }
  
  try {
    // 버킷이 존재하는지 확인
    await ensureBucketExists(bucketName);
    
    // 파일 업로드
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true,
      });
    
    if (error) {
      console.error('파일 업로드 오류:', error);
      throw error;
    }
    
    if (!data || !data.path) {
      throw new Error('업로드 응답 데이터가 유효하지 않습니다');
    }
    
    // 공개 URL 가져오기
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(data.path);
    
    if (!publicUrlData || !publicUrlData.publicUrl) {
      throw new Error('공개 URL을 가져오는 데 실패했습니다');
    }
    
    
    return {
      publicUrl: publicUrlData.publicUrl,
      path: data.path
    };
  } catch (error) {
    console.error('파일 업로드 중 오류:', error);
    throw error;
  }
}
