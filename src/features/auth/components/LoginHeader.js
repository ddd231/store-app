import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { loginStyles } from '../styles/LoginStyles';
import { useLanguage } from '../../../contexts/LanguageContext';

export default function LoginHeader({ isLogin, setIsLogin }) {
  const { t } = useLanguage();

  return (
    <View>
      <View style={loginStyles.logoContainer}>
        <Text style={loginStyles.subtitle}>
          {isLogin ? t('loginTitle') : t('signupTitle')}
        </Text>
      </View>
    </View>
  );
}