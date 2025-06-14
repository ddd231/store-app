import React, { useState } from 'react';
import { View, Text, TextInput, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from '../common/Button';
import { theme } from '../../styles/theme';
import { validateEmail } from '../../utils/validation';
import { useRateLimit } from '../../hooks/useRateLimit';

const SignupForm = ({ onSignup }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { checkLimit } = useRateLimit('signup', { maxAttempts: 4, windowMs: 60 * 60 * 1000 });

  const handleSignup = async () => {
    // 유효성 검사
    if (!username.trim() || !email.trim() || !password.trim()) {
      Alert.alert('오류', '모든 필드를 입력해주세요.');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('오류', '올바른 이메일 형식이 아닙니다.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('오류', '비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    if (username.length < 2) {
      Alert.alert('오류', '사용자 이름은 최소 2자 이상이어야 합니다.');
      return;
    }

    // Rate limiting 체크
    if (!checkLimit()) {
      Alert.alert('오류', '너무 많은 회원가입 시도입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    setLoading(true);
    try {
      await onSignup(username, email, password);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <Ionicons name="person-outline" size={20} color={theme.colors.text.secondary} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="사용자 이름"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={30}
          placeholderTextColor={theme.colors.text.secondary}
        />
      </View>

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
          placeholder="비밀번호 (6자 이상)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={true}
          maxLength={100}
          placeholderTextColor={theme.colors.text.secondary}
        />
      </View>

      <Text style={styles.termsText}>
        회원가입을 진행하면 <Text style={styles.link}>이용약관</Text> 및 <Text style={styles.link}>개인정보처리방침</Text>에 동의하는 것으로 간주됩니다.
      </Text>

      <Button
        title="회원가입"
        onPress={handleSignup}
        loading={loading}
        disabled={!username || !email || !password}
        size="large"
        style={styles.signupButton}
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
  termsText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
  },
  link: {
    color: theme.colors.primary,
    textDecorationLine: 'underline',
  },
  signupButton: {
    width: '100%',
  },
});

export default SignupForm;