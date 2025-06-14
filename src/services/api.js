/**
 * API 서비스
 * 백엔드 API와의 통신을 담당하는 모듈
 * WorksContext에서 사용하는 데이터 가져오기 및 관리 함수 제공
 */

import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 디버깅 설정
const DEBUG = true;
const debugLog = (...args) => {
  if (DEBUG) {
  }
};

// API 기본 URL 설정 (환경에 따라 다름)
export const getApiUrl = () => {
  // 개발 환경 확인
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // 플랫폼 확인
  const isWeb = Platform.OS === 'web';
  const isNative = Platform.OS === 'ios' || Platform.OS === 'android';
  
  // 기본 URL 설정
  let baseUrl = 'https://api.artify.example.com/v1'; // 실제 프로덕션 API URL
  
  // 개발 환경인 경우
  if (isDevelopment) {
    if (isWeb) {
      // 웹 개발 환경에서는 프록시 사용
      baseUrl = '/api';
    } else if (isNative) {
      // 네이티브 개발 환경에서는 로컬 IP 사용
      // localhost 대신 실제 IP 주소 사용 필요 (시뮬레이터/기기 접근용)
      baseUrl = 'http://192.168.1.100:5000/api';
    }
  }
  
  debugLog('API URL 설정:', baseUrl);
  return baseUrl;
};

// API 기본 URL
const API_URL = getApiUrl();

/**
 * 타임아웃 Promise 생성 함수
 * @param {number} timeoutMs - 타임아웃 시간 (밀리초)
 * @returns {Promise} - 타임아웃 Promise
 */
export const createTimeoutPromise = (timeoutMs = 10000) => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`요청 시간 초과 (${timeoutMs / 1000}초)`));
    }, timeoutMs);
  });
};

/**
 * 안전한 API 요청 함수
 * 타임아웃 및 에러 처리 포함
 * @param {Function} apiCall - API 호출 함수
 * @param {number} timeoutMs - 타임아웃 시간
 * @returns {Promise} - API 응답
 */
export const fetchSafely = async (apiCall, timeoutMs = 10000) => {
  try {
    const result = await Promise.race([
      apiCall(),
      createTimeoutPromise(timeoutMs)
    ]);
    return result;
  } catch (error) {
    console.error(`API 요청 오류:`, error);
    throw error;
  }
};

/**
 * 인증 토큰 가져오기
 * @returns {Promise<string|null>} - 토큰 또는 null
 */
export const getToken = async () => {
  try {
    const token = await AsyncStorage.getItem('@auth_token');
    return token;
  } catch (error) {
    console.error('토큰 가져오기 실패:', error);
    return null;
  }
};

/**
 * 토큰 저장하기
 * @param {string} token - 저장할 토큰
 * @returns {Promise<boolean>} - 저장 성공 여부
 */
export const saveToken = async (token) => {
  try {
    await AsyncStorage.setItem('@auth_token', token);
    return true;
  } catch (error) {
    console.error('토큰 저장 실패:', error);
    return false;
  }
};

/**
 * 토큰 삭제하기 (로그아웃)
 * @returns {Promise<boolean>} - 삭제 성공 여부
 */
export const removeToken = async () => {
  try {
    await AsyncStorage.removeItem('@auth_token');
    return true;
  } catch (error) {
    console.error('토큰 삭제 실패:', error);
    return false;
  }
};

// 샘플 작품 데이터 (오프라인 모드 및 테스트용)
export const sampleWorks = [
  {
    id: '1',
    title: '별의 기억',
    category: 'novel',
    author: '김작가',
    genre: '판타지',
    date: '2025-04-25',
    description: '별이 떠오른 밤, 부르는 목소리를 따라 길을 떠난 소년의 모험 이야기.',
    likes: 15,
  },
  {
    id: '2',
    title: '푸른 바다',
    category: 'painting',
    author: '김화가',
    genre: '풍경화',
    date: '2025-04-28',
    description: '제주도 해변의 놀라운 색깔을 표현해보았습니다.',
    likes: 28,
    thumbnail: 'https://via.placeholder.com/200x300/3b82f6/ffffff?text=푸른+바다',
  }
];

/**
 * 작품 목록 가져오기
 * @param {string} username - 특정 사용자의 작품만 가져올 경우
 * @returns {Promise<Array>} - 작품 목록
 */
const fetchWorks = async (username = '') => {
  try {
    const token = await getToken();
    let url = `${API_URL}/contents`;
    
    if (username) {
      url += `?author=${encodeURIComponent(username)}`;
    }
    
    const config = token ? {
      headers: { Authorization: `Bearer ${token}` }
    } : {};
    
    const response = await fetchSafely(() => axios.get(url, config));
    return response.data;
  } catch (error) {
    console.error('작품 목록 가져오기 실패:', error);
    // 오류 발생 시 샘플 데이터 반환
    return sampleWorks;
  }
};

/**
 * 작품 추가하기
 * @param {object} work - 추가할 작품 정보
 * @returns {Promise<object>} - 추가된 작품 정보
 */
const addWork = async (work) => {
  try {
    const token = await getToken();
    if (!token) throw new Error('인증 토큰이 없습니다');
    
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };
    
    const response = await fetchSafely(() => 
      axios.post(`${API_URL}/contents`, work, config)
    );
    
    return response.data;
  } catch (error) {
    console.error('작품 추가 실패:', error);
    throw error;
  }
};

/**
 * 작품 삭제하기
 * @param {string} id - 삭제할 작품 ID
 * @returns {Promise<boolean>} - 삭제 성공 여부
 */
const deleteWork = async (id) => {
  try {
    const token = await getToken();
    if (!token) throw new Error('인증 토큰이 없습니다');
    
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };
    
    await fetchSafely(() => 
      axios.delete(`${API_URL}/contents/${id}`, config)
    );
    
    return true;
  } catch (error) {
    console.error('작품 삭제 실패:', error);
    return false;
  }
};

/**
 * 북마크 토글하기
 * @param {string} id - 작품 ID
 * @returns {Promise<boolean>} - 성공 여부
 */
const toggleBookmark = async (id) => {
  try {
    const token = await getToken();
    if (!token) throw new Error('인증 토큰이 없습니다');
    
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };
    
    await fetchSafely(() => 
      axios.post(`${API_URL}/contents/${id}/bookmark`, {}, config)
    );
    
    return true;
  } catch (error) {
    console.error('북마크 토글 실패:', error);
    return false;
  }
};

/**
 * 북마크된 작품 목록 가져오기
 * @returns {Promise<Array>} - 북마크된 작품 목록
 */
const fetchBookmarkedWorks = async () => {
  try {
    const token = await getToken();
    if (!token) throw new Error('인증 토큰이 없습니다');
    
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };
    
    const response = await fetchSafely(() => 
      axios.get(`${API_URL}/contents/bookmarked`, config)
    );
    
    return response.data;
  } catch (error) {
    console.error('북마크된 작품 목록 가져오기 실패:', error);
    return [];
  }
};

// API 객체
const api = {
  fetchWorks,
  addWork,
  deleteWork,
  toggleBookmark,
  fetchBookmarkedWorks,
  getToken,
  saveToken,
  removeToken
};

export default api;
