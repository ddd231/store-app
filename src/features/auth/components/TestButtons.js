import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { loginStyles } from '../styles/LoginStyles';
import { useLanguage } from '../../../contexts/LanguageContext';

export default function TestButtons({
  showTestButtons,
  setShowTestButtons,
  onTestLogin,
  onTestSignup
}) {
  const { t } = useLanguage();

  return (
    <View>
      {showTestButtons && (
        <View style={loginStyles.testButtonsContainer}>
          <Text style={loginStyles.testButtonsTitle}>{t('testAccounts')}</Text>
          <TouchableOpacity style={loginStyles.testButton} onPress={onTestLogin}>
            <Text style={loginStyles.testButtonText}>{t('testLogin')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={loginStyles.testButton} onPress={onTestSignup}>
            <Text style={loginStyles.testButtonText}>{t('testSignup')}</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity 
        style={loginStyles.showTestButton}
        onPress={function() { setShowTestButtons(!showTestButtons); }}
      >
        <Text style={loginStyles.showTestButtonText}>
          {showTestButtons ? t('hideTestButtons') : t('showTestButtons')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}