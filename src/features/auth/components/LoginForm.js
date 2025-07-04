import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { loginStyles } from '../styles/LoginStyles';
import { useLanguage } from '../../../contexts/LanguageContext';

export default function LoginForm({
  email,
  setEmail,
  password,
  setPassword,
  username,
  setUsername,
  isLogin,
  showPassword,
  setShowPassword,
  onForgotPassword,
  isFormValid,
  isLoading,
  onSubmit,
  onToggleMode,
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
    <View style={loginStyles.formContainer}>
      {!isLogin && (
        <View style={loginStyles.inputContainer}>
          <TextInput
            style={loginStyles.input}
            value={username}
            onChangeText={setUsername}
            placeholder={t('usernamePlaceholder')}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      )}

      <View style={loginStyles.inputContainer}>
        <TextInput
          style={loginStyles.input}
          value={email}
          onChangeText={setEmail}
          placeholder={t('emailPlaceholder')}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={loginStyles.inputContainer}>
        <TextInput
          style={loginStyles.input}
          value={password}
          onChangeText={setPassword}
          placeholder={t('passwordPlaceholder')}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {isLogin && (
        <View style={loginStyles.forgotPasswordContainer}>
          <TouchableOpacity onPress={onForgotPassword}>
            <Text style={loginStyles.forgotPasswordText}>
              {t('forgotPassword')}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={loginStyles.buttonContainer}>
        {!isLogin && (
          <View style={{ marginBottom: 20 }}>
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
        )}

        <TouchableOpacity
          style={[
            loginStyles.loginButton,
            !isFormValid && loginStyles.disabledButton
          ]}
          onPress={onSubmit}
          disabled={!isFormValid || isLoading}
        >
          <Text style={[
            loginStyles.buttonText,
            !isFormValid && loginStyles.disabledButtonText
          ]}>
            {isLogin ? t('login') : t('signup')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={loginStyles.signupButton}
          onPress={onToggleMode}
        >
          <Text style={loginStyles.signupButtonText}>
            {isLogin ? t('signup') : t('login')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}