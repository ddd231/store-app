import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
  ScrollView,
  Modal,
  Text,
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { loginStyles } from '../styles/LoginStyles';
import LoginHeader from '../components/LoginHeader';
import LoginForm from '../components/LoginForm';
import SignupCheckboxes from '../components/SignupCheckboxes';
import { useLoginLogic } from '../hooks/useLoginLogic';
import { useLanguage } from '../../../contexts/LanguageContext';

export default function LoginScreen({ navigation, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [agreeToPrivacy, setAgreeToPrivacy] = useState(false);
  const [agreeToFreedom, setAgreeToFreedom] = useState(false);
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [loginAttempted, setLoginAttempted] = useState(false);
  
  const { t } = useLanguage();

  const {
    isLoading,
    handleLogin,
    handleSignup,
    handleTestLogin,
    handleTestSignup,
    handleForgotPassword
  } = useLoginLogic(onLoginSuccess, function() { setLoginAttempted(true); });

  const isFormValid = useMemo(function() {
    if (isLogin) {
      return email.trim().length > 0 && password.trim().length > 0;
    } else {
      return email.trim().length > 0 && 
             password.trim().length >= 6 && 
             username.trim().length > 0 &&
             agreeToTerms && 
             agreeToPrivacy && 
             agreeToFreedom;
    }
  }, [email, password, username, isLogin, agreeToTerms, agreeToPrivacy, agreeToFreedom]);

  function handleSubmit() {
    if (isLogin) {
      handleLogin(email, password);
    } else {
      handleSignup(email, password, username);
    }
  }

  function handleForgotPasswordPress() {
    if (email.trim()) {
      handleForgotPassword(email);
    } else {
      navigation.navigate('PasswordReset');
    }
  }

  return (
    <KeyboardAvoidingView 
      style={loginStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <ScrollView 
        contentContainerStyle={loginStyles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={loginStyles.content}>
          <LoginHeader isLogin={isLogin} setIsLogin={setIsLogin} />

          <LoginForm
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            username={username}
            setUsername={setUsername}
            isLogin={isLogin}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            onForgotPassword={handleForgotPasswordPress}
            isFormValid={isFormValid}
            isLoading={isLoading}
            onSubmit={handleSubmit}
            onToggleMode={function() { setIsLogin(!isLogin); }}
            agreeToTerms={agreeToTerms}
            setAgreeToTerms={setAgreeToTerms}
            agreeToPrivacy={agreeToPrivacy}
            setAgreeToPrivacy={setAgreeToPrivacy}
            agreeToFreedom={agreeToFreedom}
            setAgreeToFreedom={setAgreeToFreedom}
            onShowTerms={function() { setTermsModalVisible(true); }}
            onShowPrivacy={function() { setPrivacyModalVisible(true); }}
            showForgotPassword={loginAttempted}
          />

        </View>
      </ScrollView>

      {isLoading && (
        <View style={loginStyles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={loginStyles.loadingText}>{t('loading')}</Text>
        </View>
      )}

      <Modal
        visible={termsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={function() { setTermsModalVisible(false); }}
      >
        <View style={loginStyles.modal}>
          <View style={loginStyles.modalContent}>
            <View style={loginStyles.modalHeader}>
              <Text style={loginStyles.modalTitle}>{t('termsOfService')}</Text>
              <TouchableOpacity
                style={loginStyles.closeButton}
                onPress={function() { setTermsModalVisible(false); }}
              >
                <Ionicons name="close" size={24} color="#333333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={loginStyles.modalScrollView}>
              <Text style={loginStyles.modalText}>
                {t('termsContent')}
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={privacyModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={function() { setPrivacyModalVisible(false); }}
      >
        <View style={loginStyles.modal}>
          <View style={loginStyles.modalContent}>
            <View style={loginStyles.modalHeader}>
              <Text style={loginStyles.modalTitle}>{t('privacyPolicy')}</Text>
              <TouchableOpacity
                style={loginStyles.closeButton}
                onPress={function() { setPrivacyModalVisible(false); }}
              >
                <Ionicons name="close" size={24} color="#333333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={loginStyles.modalScrollView}>
              <Text style={loginStyles.modalText}>
                {t('privacyContent')}
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}