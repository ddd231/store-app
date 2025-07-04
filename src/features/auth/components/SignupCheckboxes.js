import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { loginStyles } from '../styles/LoginStyles';
import { useLanguage } from '../../../contexts/LanguageContext';

export default function SignupCheckboxes({
  agreeToTerms,
  setAgreeToTerms,
  agreeToPrivacy,
  setAgreeToPrivacy,
  agreeToFreedom,
  setAgreeToFreedom,
  onShowTerms,
  onShowPrivacy
}) {
  const { t } = useLanguage();

  return (
    <View>
      <View style={loginStyles.checkboxContainer}>
        <TouchableOpacity
          style={[
            loginStyles.checkbox,
            agreeToTerms && loginStyles.checkedCheckbox
          ]}
          onPress={function() { setAgreeToTerms(!agreeToTerms); }}
        >
          {agreeToTerms && (
            <Ionicons name="checkmark" size={12} color="#FFFFFF" />
          )}
        </TouchableOpacity>
        <Text style={loginStyles.checkboxText}>
          {t('agreeToTermsText')}{' '}
          <Text style={loginStyles.linkText} onPress={onShowTerms}>
            {t('termsOfService')}
          </Text>
          {t('agreeToTermsSuffix')}
        </Text>
      </View>

      <View style={loginStyles.checkboxContainer}>
        <TouchableOpacity
          style={[
            loginStyles.checkbox,
            agreeToPrivacy && loginStyles.checkedCheckbox
          ]}
          onPress={function() { setAgreeToPrivacy(!agreeToPrivacy); }}
        >
          {agreeToPrivacy && (
            <Ionicons name="checkmark" size={12} color="#FFFFFF" />
          )}
        </TouchableOpacity>
        <Text style={loginStyles.checkboxText}>
          {t('agreeToPrivacyText')}{' '}
          <Text style={loginStyles.linkText} onPress={onShowPrivacy}>
            {t('privacyPolicy')}
          </Text>
          {t('agreeToTermsSuffix')}
        </Text>
      </View>

      <View style={loginStyles.checkboxContainer}>
        <TouchableOpacity
          style={[
            loginStyles.checkbox,
            agreeToFreedom && loginStyles.checkedCheckbox
          ]}
          onPress={function() { setAgreeToFreedom(!agreeToFreedom); }}
        >
          {agreeToFreedom && (
            <Ionicons name="checkmark" size={12} color="#FFFFFF" />
          )}
        </TouchableOpacity>
        <Text style={loginStyles.checkboxText}>
          {t('agreeToFreedomText')}{t('agreeToTermsSuffix')}
        </Text>
      </View>
    </View>
  );
}