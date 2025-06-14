import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from '../common/Button';
import { theme } from '../../styles/theme';
import { validateEmail } from '../../utils/validation';
import { useRateLimit } from '../../hooks/useRateLimit';

const LoginForm = ({ onLogin, onForgotPassword }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { checkLimit } = useRateLimit('login', { maxAttempts: 10, windowMs: 15 * 60 * 1000 });

  const handleLogin = async () => {
    // 유효성 검사
    if (!email.trim() || !password.trim()) {
      Alert.alert('오류', '이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('오류', '올바른 이메일 형식이 아닙니다.');
      return;
    }

    // Rate limiting 체크
    if (!checkLimit()) {
      Alert.alert('오류', '너무 많은 로그인 시도입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    setLoading(true);
    try {
      await onLogin(email, password);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <Ionicons name="mail-outline" size={20} color={theme.colors.text.secondary} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="이메일"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={100}
          placeholderTextColor={theme.colors.text.secondary}
        />
      </View>

      <View style={styles.inputContainer}>
        <Ionicons name="lock-closed-outline" size={20} color={theme.colors.text.secondary} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="비밀번호"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          maxLength={100}
          placeholderTextColor={theme.colors.text.secondary}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
          <Ionicons 
            name={showPassword ? "eye-outline" : "eye-off-outline"} 
            size={20} 
            color={theme.colors.text.secondary} 
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={onForgotPassword} style={styles.forgotPassword}>
        <Text style={styles.forgotPasswordText}>비밀번호를 잊으셨나요?</Text>
      </TouchableOpacity>

      <Button
        title="로그인"
        onPress={handleLogin}
        loading={loading}
        disabled={!email || !password}
        size="large"
        style={styles.loginButton}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.medium,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    height: 50,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  inputIcon: {
    marginRight: theme.spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  eyeIcon: {
    padding: theme.spacing.xs,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: theme.spacing.lg,
  },
  forgotPasswordText: {
    color: theme.colors.primary,
    fontSize: 14,
  },
  loginButton: {
    width: '100%',
  },
});

export default LoginForm;