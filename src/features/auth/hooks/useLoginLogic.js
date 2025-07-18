import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { supabase, RateLimitedActions, showErrorAlert, showSuccessAlert, logger } from '../../../shared';
import { useLanguage } from '../../../contexts/LanguageContext';

export function useLoginLogic(onLoginSuccess, onLoginFailed) {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = useCallback(function(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, []);

  const validatePassword = useCallback(function(password) {
    return password.length >= 6;
  }, []);

  const handleLogin = useCallback(async function(email, password) {
    if (!validateEmail(email)) {
      Alert.alert(t('error'), t('invalidEmail'));
      return;
    }

    if (!validatePassword(password)) {
      Alert.alert(t('error'), t('passwordTooShort'));
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      if (error) {
        logger.error('Login error:', error);
        if (error.message === 'Invalid login credentials') {
          showErrorAlert(t('loginFailed'), t('invalidCredentials'));
        } else {
          showErrorAlert(t('loginFailed'), error.message);
        }
        if (onLoginFailed) {
          onLoginFailed();
        }
        return;
      }

      if (data.user) {
        logger.log('Login successful for user:', data.user.id);
        if (onLoginSuccess) {
          onLoginSuccess(data.user);
        }
      }
    } catch (error) {
      logger.error('Login exception:', error);
      showErrorAlert(t('loginFailed'), t('unexpectedError'));
      if (onLoginFailed) {
        onLoginFailed();
      }
    } finally {
      setIsLoading(false);
    }
  }, [t, validateEmail, validatePassword, onLoginSuccess, onLoginFailed]);

  const handleSignup = useCallback(async function(email, password, username) {
    if (!validateEmail(email)) {
      Alert.alert(t('error'), t('invalidEmail'));
      return;
    }

    if (!validatePassword(password)) {
      Alert.alert(t('error'), t('passwordTooShort'));
      return;
    }

    if (!username.trim()) {
      Alert.alert(t('error'), t('usernameRequired'));
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            username: username.trim()
          }
        }
      });

      if (error) {
        logger.error('Signup error:', error);
        showErrorAlert(t('signupFailed'), error.message);
        return;
      }

      if (data.user) {
        logger.log('Signup successful for user:', data.user.id);
        showSuccessAlert(t('signupSuccessMessage'));
        if (onLoginSuccess) {
          onLoginSuccess(data.user);
        }
      }
    } catch (error) {
      logger.error('Signup exception:', error);
      showErrorAlert(t('signupFailed'), t('unexpectedError'));
    } finally {
      setIsLoading(false);
    }
  }, [t, validateEmail, validatePassword, onLoginSuccess]);

  const handleTestLogin = useCallback(async function() {
    await handleLogin('test@example.com', 'password123');
  }, [handleLogin]);

  const handleTestSignup = useCallback(async function() {
    const randomId = Math.random().toString(36).substring(7);
    await handleSignup(`test${randomId}@example.com`, 'password123', `testuser${randomId}`);
  }, [handleSignup]);

  const handleForgotPassword = useCallback(async function(email) {
    if (!validateEmail(email)) {
      Alert.alert(t('error'), t('invalidEmail'));
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      
      if (error) {
        logger.error('Password reset error:', error);
        showErrorAlert(t('error'), error.message);
        return;
      }

      showSuccessAlert(t('passwordResetSent'), t('passwordResetSentMessage'));
    } catch (error) {
      logger.error('Password reset exception:', error);
      showErrorAlert(t('error'), t('unexpectedError'));
    }
  }, [t, validateEmail]);

  return {
    isLoading,
    handleLogin,
    handleSignup,
    handleTestLogin,
    handleTestSignup,
    handleForgotPassword
  };
}