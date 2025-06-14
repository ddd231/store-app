/**
 * 보안 저장소 유틸리티
 * 토큰과 민감한 정보를 안전하게 저장/조회
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';

// 암호화 키 (환경변수 또는 동적 생성)
const ENCRYPTION_KEY = process.env.EXPO_PUBLIC_ENCRYPTION_KEY || 
  `ARLD_${Date.now()}_${Math.random().toString(36)}`;

/**
 * 데이터를 암호화하여 저장
 * @param {string} key - 저장 키
 * @param {any} value - 저장할 값
 * @returns {Promise<void>}
 */
export async function setSecureItem(key, value) {
  try {
    const jsonValue = JSON.stringify(value);
    const encrypted = CryptoJS.AES.encrypt(jsonValue, ENCRYPTION_KEY).toString();
    await AsyncStorage.setItem(`@secure_${key}`, encrypted);
  } catch (error) {
    if (__DEV__) {
      console.error('[SecureStorage] 저장 오류:', error);
    }
    throw new Error('데이터 저장에 실패했습니다.');
  }
}

/**
 * 암호화된 데이터를 복호화하여 조회
 * @param {string} key - 조회 키
 * @returns {Promise<any>} - 복호화된 값
 */
export async function getSecureItem(key) {
  try {
    const encrypted = await AsyncStorage.getItem(`@secure_${key}`);
    if (!encrypted) return null;
    
    const decryptedBytes = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY);
    const decryptedText = decryptedBytes.toString(CryptoJS.enc.Utf8);
    
    if (!decryptedText) {
      // 복호화 실패 - 손상된 데이터이거나 키가 변경됨
      await AsyncStorage.removeItem(`@secure_${key}`);
      return null;
    }
    
    return JSON.parse(decryptedText);
  } catch (error) {
    if (__DEV__) {
      console.error('[SecureStorage] 조회 오류:', error);
    }
    // 손상된 데이터 제거
    await AsyncStorage.removeItem(`@secure_${key}`);
    return null;
  }
}

/**
 * 보안 데이터 삭제
 * @param {string} key - 삭제할 키
 * @returns {Promise<void>}
 */
export async function removeSecureItem(key) {
  try {
    await AsyncStorage.removeItem(`@secure_${key}`);
  } catch (error) {
    if (__DEV__) {
      console.error('[SecureStorage] 삭제 오류:', error);
    }
  }
}

/**
 * 모든 보안 데이터 삭제 (로그아웃 시 사용)
 * @returns {Promise<void>}
 */
export async function clearAllSecureItems() {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const secureKeys = keys.filter(key => key.startsWith('@secure_'));
    await AsyncStorage.multiRemove(secureKeys);
  } catch (error) {
    if (__DEV__) {
      console.error('[SecureStorage] 전체 삭제 오류:', error);
    }
  }
}

// 토큰 관련 편의 함수들
export const TokenStorage = {
  /**
   * 인증 토큰 저장
   * @param {string} token - JWT 토큰
   */
  async setAuthToken(token) {
    await setSecureItem('auth_token', { 
      token, 
      timestamp: Date.now(),
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7일 후 만료
    });
  },

  /**
   * 인증 토큰 조회
   * @returns {Promise<string|null>} - 토큰 또는 null
   */
  async getAuthToken() {
    const tokenData = await getSecureItem('auth_token');
    
    // 만료 체크
    if (tokenData && tokenData.expiresAt && Date.now() > tokenData.expiresAt) {
      await removeSecureItem('auth_token');
      return null;
    }
    
    return tokenData?.token || null;
  },

  /**
   * 리프레시 토큰 저장
   * @param {string} refreshToken - 리프레시 토큰
   */
  async setRefreshToken(refreshToken) {
    await setSecureItem('refresh_token', { 
      token: refreshToken, 
      timestamp: Date.now() 
    });
  },

  /**
   * 리프레시 토큰 조회
   * @returns {Promise<string|null>} - 리프레시 토큰 또는 null
   */
  async getRefreshToken() {
    const tokenData = await getSecureItem('refresh_token');
    return tokenData?.token || null;
  },

  /**
   * 모든 토큰 삭제
   */
  async clearTokens() {
    await Promise.all([
      removeSecureItem('auth_token'),
      removeSecureItem('refresh_token')
    ]);
  }
};