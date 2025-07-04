import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import ko from '../locales/ko';
import en from '../locales/en';
import ja from '../locales/ja';
import { logger, showErrorAlert } from '../shared';

const LanguageContext = createContext();

const translations = { ko, en, ja };

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}

export function LanguageProvider({ children }) {
  const [currentLanguage, setCurrentLanguage] = useState('ko');

  function t(key) {
    return translations[currentLanguage][key] || key;
  };

  async function changeLanguage(lang) {
    if (!translations[lang]) {
      logger.error('지원하지 않는 언어:', lang);
      return;
    }

    setCurrentLanguage(lang);
    
    try {
      await AsyncStorage.setItem('app_language', lang);
    } catch (error) {
      logger.error('언어 설정 저장 오류:', error);
      // AsyncStorage 실패 시에도 메모리 상태는 유지하고 사용자에게 알리지 않음
      // (언어 변경 자체는 작동하므로)
    }
  };

  function getCountryBasedLanguage() {
    try {
      const region = Localization.region;
      const countryLanguageMap = {
        'KR': 'ko',
        'JP': 'ja', 
        'US': 'en'
      };
      return countryLanguageMap[region] || 'ko';
    } catch (error) {
      logger.error('지역 정보 조회 실패:', error);
      return 'ko';
    }
  };

  async function loadLanguage() {
    try {
      const saved = await AsyncStorage.getItem('app_language');
      if (saved && translations[saved]) {
        setCurrentLanguage(saved);
      } else {
        // 저장된 언어가 없으면 국가 기반으로 설정
        const countryLang = getCountryBasedLanguage();
        setCurrentLanguage(countryLang);
        
        // 첫 실행 시 국가 기반 언어를 저장
        try {
          await AsyncStorage.setItem('app_language', countryLang);
        } catch (storageError) {
          logger.error('초기 언어 설정 저장 실패:', storageError);
        }
      }
    } catch (error) {
      logger.error('언어 설정 로드 오류:', error);
      // AsyncStorage 실패 시 기본 언어로 설정
      setCurrentLanguage('ko');
      
      // 심각한 저장소 오류인 경우 사용자에게 알림
      if (error.message?.includes('quota') || error.message?.includes('storage')) {
        showErrorAlert(error, '언어 설정 로드');
      }
    }
  };

  function getAvailableLanguages() {
    return [
      { code: 'ko', name: '한국어' },
      { code: 'en', name: 'English' },
      { code: 'ja', name: '日本語' }
    ];
  };

  useEffect(function() {
    loadLanguage();
  }, []);

  return (
    <LanguageContext.Provider value={{
      currentLanguage,
      changeLanguage,
      t,
      getAvailableLanguages
    }}>
      {children}
    </LanguageContext.Provider>
  );
};