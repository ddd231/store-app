import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabaseClient';

export default function PasswordResetScreen() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState('');

  useEffect(() => {
    checkAndSetupSession();
  }, []);

  const checkAndSetupSession = async () => {
    setIsInitializing(true);
    try {
      
      // URL hash에서 토큰 확인
      if (typeof window !== 'undefined' && window.location && window.location.hash) {
        const hash = window.location.hash;
        
        if (hash.includes('type=recovery') && hash.includes('access_token=')) {
          
          // URL에서 이메일 정보 직접 추출 (JWT 토큰 디코딩)
          try {
            const urlParams = new URLSearchParams(hash.substring(1));
            const accessToken = urlParams.get('access_token');
            
            if (accessToken) {
              // JWT 토큰에서 이메일 추출 (Base64 디코딩)
              const tokenParts = accessToken.split('.');
              if (tokenParts.length === 3) {
                const payload = JSON.parse(atob(tokenParts[1]));
                if (payload.email) {
                  setUserEmail(payload.email);
                }
              }
            }
          } catch (tokenError) {
          }
          
          // 바로 비밀번호 변경 폼 표시 (세션 확인 생략)
          setIsTokenValid(true);
          setInitError('');
        } else if (hash.includes('error=')) {
          // 오류가 있는 경우
          const urlParams = new URLSearchParams(hash.substring(1));
          const error = urlParams.get('error');
          const errorDescription = urlParams.get('error_description');
          
          console.error('[PasswordReset] URL 오류:', error, errorDescription);
          
          if (error === 'access_denied' || errorDescription?.includes('expired')) {
            setInitError('재설정 링크가 만료되었습니다. 새로운 재설정 이메일을 요청해주세요.');
          } else {
            setInitError(`오류가 발생했습니다: ${errorDescription || error}`);
          }
          setIsTokenValid(false);
        } else {
          setInitError('유효하지 않은 비밀번호 재설정 링크입니다.');
          setIsTokenValid(false);
        }
      } else {
        setInitError('비밀번호 재설정 토큰이 없습니다.');
        setIsTokenValid(false);
      }
    } catch (error) {
      console.error('[PasswordReset] 초기화 오류:', error);
      setInitError(`초기화 중 오류가 발생했습니다: ${error.message}`);
      setIsTokenValid(false);
    } finally {
      setIsInitializing(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!newPassword.trim()) {
      Alert.alert('오류', '새 비밀번호를 입력해주세요.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('오류', '비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('오류', '비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    setIsLoading(true);
    try {
      
      // URL에서 토큰 직접 가져오기
      const hash = window.location.hash;
      const urlParams = new URLSearchParams(hash.substring(1));
      const accessToken = urlParams.get('access_token');
      
      if (!accessToken) {
        throw new Error('인증 토큰이 없습니다. 재설정 이메일을 다시 요청해주세요.');
      }
      
      
      // Supabase REST API 직접 호출
      const { supabaseUrl, supabaseAnonKey } = await import('../services/supabaseClient');
      const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'apikey': supabaseAnonKey
        },
        body: JSON.stringify({
          password: newPassword.trim()
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('[PasswordReset] REST API 오류:', errorData);
        throw new Error(errorData.message || `HTTP ${response.status}: 비밀번호 변경 실패`);
      }
      
      const data = await response.json();


      // 세션 종료
      await supabase.auth.signOut();

      Alert.alert(
        '비밀번호 변경 완료',
        '새 비밀번호로 설정되었습니다.\n이 창을 닫고 새 비밀번호로 로그인해주세요.',
        [{ 
          text: '확인', 
          onPress: () => {
            // 창 닫기 또는 메인 앱으로 리다이렉트
            if (typeof window !== 'undefined') {
              window.close(); // 팝업 창이면 닫기
              // 또는 메인 앱으로 리다이렉트
              window.location.href = '/';
            }
          }
        }]
      );
    } catch (error) {
      console.error('[PasswordReset] 비밀번호 변경 오류:', error);
      
      let errorMessage = `비밀번호 변경 실패: ${error.message}`;
      if (error.message.includes('Auth session missing')) {
        errorMessage = '인증 세션이 만료되었습니다.\n재설정 이메일을 다시 요청해주세요.';
      } else if (error.message.includes('Password should be at least')) {
        errorMessage = '비밀번호는 6자 이상이어야 합니다.';
      }
      
      Alert.alert('오류', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // 초기화 중인 경우 로딩 표시
  if (isInitializing) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.title}>인증 처리 중...</Text>
          <Text style={styles.subtitle}>비밀번호 재설정 링크를 확인하고 있습니다.</Text>
        </View>
      </View>
    );
  }

  // 토큰이 유효하지 않은 경우 오류 표시
  if (!isTokenValid) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="alert-circle" size={60} color="#FF6B6B" />
          <Text style={styles.title}>인증 오류</Text>
          <Text style={styles.subtitle}>{initError || '유효하지 않은 재설정 링크입니다.'}</Text>
        </View>
        
        <View style={styles.form}>
          {initError && initError.includes('타임아웃') && (
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={() => {
                window.location.reload();
              }}
            >
              <Text style={styles.primaryButtonText}>다시 시도</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => {
              if (typeof window !== 'undefined') {
                window.close(); // 창 닫기
                window.location.href = '/'; // 메인 페이지로 이동
              }
            }}
          >
            <Text style={styles.secondaryButtonText}>돌아가기</Text>
          </TouchableOpacity>
          
          <Text style={styles.infoText}>
            문제가 계속되면 새로운 비밀번호 재설정 이메일을 요청해주세요.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Ionicons name="lock-closed" size={60} color="#007AFF" />
        <Text style={styles.title}>비밀번호 재설정</Text>
        <Text style={styles.subtitle}>{userEmail}의 새 비밀번호를 설정하세요.</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="새 비밀번호 (6자 이상)"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!showPassword}
            editable={!isLoading}
            autoFocus={true}
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons 
              name={showPassword ? "eye-off" : "eye"} 
              size={20} 
              color="#666" 
            />
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="비밀번호 확인"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showPassword}
            editable={!isLoading}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handlePasswordReset}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.primaryButtonText}>
              비밀번호 변경
            </Text>
          )}
        </TouchableOpacity>

        <Text style={styles.infoText}>
          • 비밀번호는 6자 이상이어야 합니다{'\n'}
          • 변경 후 새 비밀번호로 로그인해주세요
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#333',
  },
  eyeIcon: {
    padding: 4,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});