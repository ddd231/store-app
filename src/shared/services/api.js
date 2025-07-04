/**
 * API 서비스
 * 백엔드 API와의 통신을 담당하는 모듈
 * WorksContext에서 사용하는 데이터 가져오기 및 관리 함수 제공
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';

// 디버깅 비활성화
const DEBUG = false;
function debugLog(...args) {
  // 프로덕션에서는 로깅하지 않음
};

// API 기본 URL 설정 (프로덕션 전용)
export function getApiUrl() {
  // 프로덕션 API URL만 사용
  const baseUrl = 'https://api.artify.example.com/v1';
  
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
export function createTimeoutPromise(timeoutMs = 10000) {
  return new Promise(function(_, reject) {
    setTimeout(function() {
      reject(new Error(`요청 시간 초과 (${timeoutMs / 1000}초)`));
    }, timeoutMs);
  });
};

/**
 * 최적화된 fetch 래퍼 함수 (axios 대체)
 * @param {string} url - 요청 URL
 * @param {object} options - fetch 옵션
 * @param {number} timeoutMs - 타임아웃 시간
 * @returns {Promise} - API 응답
 */
export async function fetchWithTimeout(url, options = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(function() { controller.abort(); }, timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      return { data, status: response.status };
    }

    return { data: await response.text(), status: response.status };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`요청 시간 초과 (${timeoutMs / 1000}초)`);
    }
    logger.error('API 요청 오류:', error);
    throw error;
  }
};

/**
 * 안전한 API 요청 함수 (하위 호환성)
 * @param {Function} apiCall - API 호출 함수
 * @param {number} timeoutMs - 타임아웃 시간
 * @returns {Promise} - API 응답
 */
export async function fetchSafely(apiCall, timeoutMs = 10000) {
  try {
    const result = await Promise.race([
      apiCall(),
      createTimeoutPromise(timeoutMs)
    ]);
    return result;
  } catch (error) {
    logger.error('API 요청 오류:', error);
    throw error;
  }
};

/**
 * 인증 토큰 가져오기
 * @returns {Promise<string|null>} - 토큰 또는 null
 */
export async function getToken() {
  try {
    const token = await AsyncStorage.getItem('@auth_token');
    return token;
  } catch (error) {
    logger.error('토큰 가져오기 실패:', error);
    return null;
  }
};

/**
 * 토큰 저장하기
 * @param {string} token - 저장할 토큰
 * @returns {Promise<boolean>} - 저장 성공 여부
 */
export async function saveToken(token) {
  try {
    await AsyncStorage.setItem('@auth_token', token);
    return true;
  } catch (error) {
    logger.error('토큰 저장 실패:', error);
    return false;
  }
};

/**
 * 토큰 삭제하기 (로그아웃)
 * @returns {Promise<boolean>} - 삭제 성공 여부
 */
export async function removeToken() {
  try {
    await AsyncStorage.removeItem('@auth_token');
    return true;
  } catch (error) {
    logger.error('토큰 삭제 실패:', error);
    return false;
  }
};


/**
 * 작품 목록 가져오기
 * @param {string} username - 특정 사용자의 작품만 가져올 경우
 * @returns {Promise<Array>} - 작품 목록
 */
async function fetchWorks(username = '') {
  try {
    const token = await getToken();
    let url = `${API_URL}/contents`;
    
    if (username) {
      url += `?author=${encodeURIComponent(username)}`;
    }
    
    const options = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      }
    };
    
    const response = await fetchWithTimeout(url, options);
    return response.data;
  } catch (error) {
    logger.error('작품 목록 가져오기 실패:', error);
    // 프로덕션에서는 실제 오류를 반환
    throw error;
  }
};

/**
 * 작품 추가하기
 * @param {object} work - 추가할 작품 정보
 * @returns {Promise<object>} - 추가된 작품 정보
 */
async function addWork(work) {
  try {
    const token = await getToken();
    if (!token) throw new Error('인증 토큰이 없습니다');
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(work)
    };
    
    const response = await fetchWithTimeout(`${API_URL}/contents`, options);
    return response.data;
  } catch (error) {
    logger.error('작품 추가 실패:', error);
    throw error;
  }
};

/**
 * 작품 삭제하기
 * @param {string} id - 삭제할 작품 ID
 * @returns {Promise<boolean>} - 삭제 성공 여부
 */
async function deleteWork(id) {
  try {
    const token = await getToken();
    if (!token) throw new Error('인증 토큰이 없습니다');
    
    const options = {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    };
    
    await fetchWithTimeout(`${API_URL}/contents/${id}`, options);
    return true;
  } catch (error) {
    logger.error('작품 삭제 실패:', error);
    return false;
  }
};

/**
 * 북마크 토글하기
 * @param {string} id - 작품 ID
 * @returns {Promise<boolean>} - 성공 여부
 */
async function toggleBookmark(id) {
  try {
    const token = await getToken();
    if (!token) throw new Error('인증 토큰이 없습니다');
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({})
    };
    
    await fetchWithTimeout(`${API_URL}/contents/${id}/bookmark`, options);
    return true;
  } catch (error) {
    logger.error('북마크 토글 실패:', error);
    return false;
  }
};

/**
 * 북마크된 작품 목록 가져오기
 * @returns {Promise<Array>} - 북마크된 작품 목록
 */
async function fetchBookmarkedWorks() {
  try {
    const token = await getToken();
    if (!token) throw new Error('인증 토큰이 없습니다');
    
    const options = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    };
    
    const response = await fetchWithTimeout(`${API_URL}/contents/bookmarked`, options);
    return response.data;
  } catch (error) {
    logger.error('북마크된 작품 목록 가져오기 실패:', error);
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
