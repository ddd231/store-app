import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Localization from 'expo-localization';
import { Button, validateEmail, useRateLimit } from '../../../shared';
import { theme } from '../../../styles/theme';
import { useLanguage } from '../../../contexts/LanguageContext';

export default function SignupForm({ onSignup }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [country, setCountry] = useState('KR');
  const [loading, setLoading] = useState(false);
  
  const { checkLimit } = useRateLimit('signup', { maxAttempts: 4, windowMs: 60 * 60 * 1000 });
  const { t } = useLanguage();

  useEffect(function() {
    function detectCountry() {
      try {
        const region = Localization.region;
        const supportedCountries = ['KR', 'JP', 'US'];
        
        if (region && supportedCountries.includes(region)) {
          setCountry(region);
        } else {
          setCountry('KR');
        }
      } catch (error) {
        setCountry('KR');
      }
    };
    
    detectCountry();
  }, []);


  async function handleSignup() {
    // 유효성 검사
    if (!username.trim() || !email.trim() || !password.trim()) {
      Alert.alert(t('error'), t('allFieldsRequired'));
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert(t('error'), t('invalidEmailFormat'));
      return;
    }

    if (password.length < 6) {
      Alert.alert(t('error'), t('passwordMinLength'));
      return;
    }

    if (username.length < 2) {
      Alert.alert(t('error'), t('usernameMinLength'));
      return;
    }

    // Rate limiting 체크
    if (!checkLimit()) {
      Alert.alert(t('error'), t('tooManySignupAttempts'));
      return;
    }

    setLoading(true);
    try {
      await onSignup(username, email, password, country);
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
          placeholder={t('usernamePlaceholder')}
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
          placeholder={t('emailPlaceholder')}
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
          placeholder={t('passwordPlaceholder')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={true}
          maxLength={100}
          placeholderTextColor={theme.colors.text.secondary}
        />
      </View>

      <Button
        title={t('signup')}
        onPress={handleSignup}
        loading={loading}
        disabled={!username || !email || !password}
        size="large"
        style={styles.signupButton}
      />
      
      <Text style={styles.termsText}>
        {t('termsAgreement')}
      </Text>
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
    marginTop: theme.spacing.md,
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

