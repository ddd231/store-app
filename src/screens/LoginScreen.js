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
  ActivityIndicator,
  ScrollView,
  Image,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase, supabaseUrl, supabaseAnonKey } from '../services/supabaseClient';
import { RateLimitedActions } from '../utils/rateLimiter';

export default function LoginScreen({ navigation, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [agreeToPrivacy, setAgreeToPrivacy] = useState(false);
  const [agreeToFreedom, setAgreeToFreedom] = useState(false);
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [showTestButtons, setShowTestButtons] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [showAccountFind, setShowAccountFind] = useState(false);

  useEffect(() => {
    // 기존 세션 확인
    checkExistingSession();
    
    // URL에서 비밀번호 재설정 토큰 확인
    checkPasswordResetToken();
  }, []);

  const checkPasswordResetToken = async () => {
    try {
      // URL hash에서 토큰 확인 (웹에서만)
      if (typeof window !== 'undefined' && window.location && window.location.hash) {
        const hash = window.location.hash;
        
        if (hash.includes('type=recovery')) {
          
          // URL에서 토큰 추출
          const urlParams = new URLSearchParams(hash.substring(1)); // # 제거
          const accessToken = urlParams.get('access_token');
          const refreshToken = urlParams.get('refresh_token');
          
          
          if (accessToken) {
            try {
              // 세션 설정
              const { data, error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken
              });
              
              if (error) {
                console.error('[LoginScreen] 세션 설정 오류:', error);
                throw error;
              }
              
              
              // URL 정리 (브라우저 히스토리에서 토큰 제거)
              if (window.history && window.history.replaceState) {
                window.history.replaceState({}, document.title, window.location.pathname);
              }
              
              Alert.alert(
                '비밀번호 재설정',
                '인증이 완료되었습니다.\n새로운 비밀번호를 설정하세요.',
                [
                  {
                    text: '확인',
                    onPress: () => {
                      setIsLogin(false); // 회원가입 탭으로 전환
                      setEmail(data.user?.email || ''); // 이메일 자동 입력
                    }
                  }
                ]
              );
            } catch (sessionError) {
              console.error('[LoginScreen] 세션 처리 오류:', sessionError);
              Alert.alert(
                '오류',
                `세션 설정 실패: ${sessionError.message}\n\n수동으로 재설정 URL을 입력해주세요.`
              );
            }
          } else {
            Alert.alert(
              '오류',
              'URL에서 인증 토큰을 찾을 수 없습니다.\n수동으로 재설정 URL을 입력해주세요.'
            );
          }
        }
      }
    } catch (error) {
      console.error('[LoginScreen] 토큰 확인 오류:', error);
      Alert.alert('오류', __DEV__ ? `토큰 처리 중 오류가 발생했습니다: ${error.message}` : '토큰 처리 중 오류가 발생했습니다.');
    }
  };

  const checkExistingSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        if (onLoginSuccess) {
          onLoginSuccess(session.user);
        }
      }
    } catch (error) {
      console.error('[LoginScreen] 세션 확인 오류:', error);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('오류', '이메일과 비밀번호를 입력해주세요.');
      return;
    }

    // Rate Limiting 체크
    const rateLimitCheck = RateLimitedActions.checkLogin(email.trim());
    if (!rateLimitCheck.allowed) {
      Alert.alert('요청 제한', rateLimitCheck.message);
      return;
    }

    setIsLoading(true);
    try {
      if (__DEV__) {
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        if (__DEV__) {
          console.error('[LoginScreen] 로그인 오류:', error.message);
        }
        throw error;
      }

      if (__DEV__) {
      }
      
      if (onLoginSuccess) {
        onLoginSuccess(data.user);
      }
    } catch (error) {
      if (__DEV__) {
        console.error('[LoginScreen] 로그인 오류:', error.message);
      }
      
      let errorMessage = '로그인 중 오류가 발생했습니다.';
      
      // 400 오류 및 Invalid credentials 처리
      if (error.status === 400 && error.message.includes('Invalid login credentials')) {
        setShowPasswordReset(true); // 비밀번호 찾기 버튼 표시
        setShowAccountFind(true); // 아이디 찾기 버튼 표시
        errorMessage = `로그인 실패!\n\n입력 정보:\n이메일: ${email}\n\n가능한 원인:\n1️⃣ 비밀번호가 틀렸습니다\n2️⃣ 이메일 인증이 완료되지 않았습니다\n3️⃣ 계정이 존재하지 않습니다\n\n해결방법:\n• "계정 상세 정보 확인" 버튼으로 정확한 원인 파악\n• 비밀번호가 기억나지 않으면 "비밀번호 재설정"\n• 이메일 인증이 안 됐으면 "인증 이메일 재전송"`;
      } else if (error.status === 400) {
        errorMessage = __DEV__ 
          ? `400 오류 발생!\n\n상세 정보:\n• 상태 코드: ${error.status}\n• 메시지: ${error.message}\n\n가능한 원인:\n• API 키가 잘못되었습니다\n• 요청 형식이 올바르지 않습니다\n• 이메일 형식이 잘못되었습니다\n• Supabase 설정 문제\n\n게스트 로그인을 시도해보세요.`
          : '로그인 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = '이메일 인증을 완료해주세요. 이메일함을 확인하세요.';
      } else if (error.message.includes('Invalid API key')) {
        errorMessage = 'Supabase 설정 오류입니다. 게스트로 로그인해주세요.';
      } else if (error.message.includes('signup is disabled')) {
        errorMessage = '로그인이 비활성화되어 있습니다.';
      } else if (error.message.includes('JWT expired')) {
        errorMessage = 'API 키가 만료되었습니다. 새로운 키가 필요합니다.';
      } else {
        errorMessage = __DEV__ 
          ? `로그인 오류 (코드 ${error.status || 'unknown'}):\n${error.message}`
          : '로그인 중 오류가 발생했습니다.';
      }
      
      Alert.alert('로그인 실패', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    // 현재 세션이 있고 비밀번호만 입력된 경우 비밀번호 재설정으로 처리
    const { data: { session } } = await supabase.auth.getSession();
    if (session && password.trim() && !username.trim()) {
      return handlePasswordUpdate();
    }

    if (!email.trim() || !password.trim() || !username.trim()) {
      Alert.alert('오류', '모든 필드를 입력해주세요.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('오류', '비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    if (!agreeToTerms || !agreeToPrivacy || !agreeToFreedom) {
      Alert.alert('오류', '모든 약관에 동의해주세요.');
      return;
    }

    // Rate Limiting 체크
    const rateLimitCheck = RateLimitedActions.checkSignup(email.trim());
    if (!rateLimitCheck.allowed) {
      Alert.alert('요청 제한', rateLimitCheck.message);
      return;
    }

    setIsLoading(true);
    try {
      if (__DEV__) {
      }
      
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
        options: {
          data: {
            username: username.trim(),
            full_name: username.trim(),
          },
          emailRedirectTo: process.env.EXPO_PUBLIC_APP_URL
        }
      });

      if (__DEV__) {
      }

      if (error) {
        console.error('[LoginScreen] 회원가입 오류 상세:', error);
        throw error;
      }

      if (__DEV__) {
      }

      if (data.user && !data.session) {
        Alert.alert(
          '회원가입 완료',
          `${email}로 인증 이메일을 발송했습니다.\n\n이메일함을 확인하여 인증 링크를 클릭해주세요.\n\n이메일이 오지 않으면:\n• 스팸함 확인\n• "인증 이메일 재전송" 버튼 사용\n• 5-10분 정도 기다려보세요`,
          [{ text: '확인', onPress: () => setIsLogin(true) }]
        );
      } else if (data.session) {
        
        if (onLoginSuccess) {
          onLoginSuccess(data.user);
        }
        
        Alert.alert('성공', '회원가입이 완료되었습니다!');
      } else {
        Alert.alert(
          '회원가입 완료',
          '계정이 생성되었지만 응답이 예상과 다릅니다.\n콘솔을 확인하고 로그인을 시도해보세요.',
          [{ text: '확인', onPress: () => setIsLogin(true) }]
        );
      }
    } catch (error) {
      console.error('[LoginScreen] 회원가입 오류:', error);
      
      let errorMessage = '회원가입 중 오류가 발생했습니다.';
      if (error.message.includes('User already registered')) {
        errorMessage = '이미 등록된 이메일입니다.';
      } else if (error.message.includes('Password should be at least 6 characters')) {
        errorMessage = '비밀번호는 6자 이상이어야 합니다.';
      } else if (error.message.includes('Invalid API key')) {
        errorMessage = 'API 키가 유효하지 않습니다. Supabase 설정을 확인해주세요.';
      } else if (error.message.includes('signup is disabled')) {
        errorMessage = '회원가입이 비활성화되어 있습니다.';
      }
      
      Alert.alert('회원가입 실패', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!password.trim()) {
      Alert.alert('오류', '새 비밀번호를 입력해주세요.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('오류', '비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    setIsLoading(true);
    try {
      
      // 현재 세션 확인
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('인증 세션이 없습니다. 재설정 링크를 다시 클릭해주세요.');
      }
      
      
      const { data, error } = await supabase.auth.updateUser({
        password: password.trim()
      });

      if (error) {
        console.error('[LoginScreen] 비밀번호 업데이트 오류:', error);
        throw error;
      }


      // 세션 종료 후 로그인 페이지로 이동
      await supabase.auth.signOut();

      Alert.alert(
        '비밀번호 변경 완료',
        '새 비밀번호로 설정되었습니다.\n새 비밀번호로 다시 로그인해주세요.',
        [{ 
          text: '확인', 
          onPress: () => {
            setIsLogin(true);
            setPassword('');
            setUsername('');
          }
        }]
      );
    } catch (error) {
      console.error('[LoginScreen] 비밀번호 업데이트 오류:', error);
      
      let errorMessage = `비밀번호 변경 실패: ${error.message}`;
      if (error.message.includes('Auth session missing')) {
        errorMessage = '인증 세션이 만료되었습니다.\n재설정 이메일을 다시 요청해주세요.';
      }
      
      Alert.alert('오류', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email.trim()) {
      Alert.alert('오류', '이메일을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: process.env.EXPO_PUBLIC_APP_URL
      });
      
      if (error) {
        throw error;
      }
      
      Alert.alert('이메일 전송 완료', `${email}로 비밀번호 재설정 이메일을 발송했습니다.\n\n이메일함을 확인하고 링크를 클릭하여 새 비밀번호를 설정해주세요.`);
      setShowPasswordReset(false); // 버튼 숨기기
      setShowAccountFind(false); // 아이디 찾기 버튼도 숨기기
    } catch (error) {
      let errorMessage = '비밀번호 재설정 이메일 발송에 실패했습니다.';
      if (error.message.includes('User not found')) {
        errorMessage = '해당 이메일로 가입된 계정이 없습니다.';
      } else if (error.message.includes('Email rate limit exceeded')) {
        errorMessage = '이메일 전송 한도를 초과했습니다.\n1-2분 후 다시 시도해주세요.';
      }
      
      Alert.alert('오류', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccountFind = async () => {
    Alert.alert(
      '아이디 찾기',
      '이 기능은 현재 준비중입니다.\n\n이메일 주소가 기억나지 않으시면:\n\n1. 가입 시 사용했던 이메일들을 확인해보세요\n2. 스팸함/정크메일함도 확인해보세요\n3. 고객센터에 문의해주세요',
      [
        { text: '확인', style: 'default' }
      ]
    );
  };

  const handleResendEmail = async () => {
    if (!email.trim()) {
      Alert.alert('오류', '이메일을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      
      const { data, error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
        options: {
          emailRedirectTo: process.env.EXPO_PUBLIC_APP_URL
        }
      });


      if (error) {
        console.error('[LoginScreen] 이메일 재전송 오류:', error);
        throw error;
      }

      Alert.alert(
        '이메일 재전송 완료', 
        `${email}로 인증 이메일을 다시 발송했습니다.\n\n확인사항:\n• 이메일함 (받은편지함)\n• 스팸함/정크메일함\n• 프로모션 탭 (Gmail의 경우)\n\n이메일이 5-10분 내에 오지 않으면 이메일 주소를 다시 확인해주세요.`
      );
    } catch (error) {
      console.error('[LoginScreen] 이메일 재전송 실패:', error);
      
      let errorMessage = '이메일 재전송에 실패했습니다.';
      if (error.message.includes('Email rate limit exceeded')) {
        errorMessage = '이메일 전송 한도를 초과했습니다.\n1-2분 후 다시 시도해주세요.';
      } else if (error.message.includes('User not found')) {
        errorMessage = '해당 이메일로 가입된 계정이 없습니다.\n먼저 회원가입을 진행해주세요.';
      } else if (error.message.includes('Email already confirmed')) {
        errorMessage = '이메일이 이미 인증되었습니다.\n로그인을 시도해보세요.';
      } else {
        errorMessage = `이메일 재전송 오류:\n${error.message}\n\nSupabase 설정을 확인해주세요.`;
      }
      
      Alert.alert('재전송 실패', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const testSupabaseConnection = async () => {
    setIsLoading(true);
    try {
      
      // 1. 기본 REST API 연결 테스트
      const restResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`
        }
      });
      
      
      // 2. Auth API 연결 테스트
      const authResponse = await fetch(`${supabaseUrl}/auth/v1/settings`, {
        method: 'GET',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`
        }
      });
      
      
      // 3. Auth 설정 확인
      if (authResponse.ok) {
        const authSettings = await authResponse.json();
        
        Alert.alert(
          '연결 성공', 
          `Supabase 연결이 정상입니다.\n\nREST API: ${restResponse.status}\nAuth API: ${authResponse.status}\n\n이메일 인증: ${authSettings.email_enabled ? '활성화됨' : '비활성화됨'}\n회원가입: ${authSettings.signup_enabled ? '활성화됨' : '비활성화됨'}`
        );
      } else {
        throw new Error(`Auth API 오류: ${authResponse.status}`);
      }
    } catch (error) {
      console.error('[LoginScreen] Supabase 연결 오류:', error);
      
      let errorMessage = `연결 오류: ${error.message}`;
      if (error.message.includes('Failed to fetch')) {
        errorMessage = '네트워크 연결 오류입니다.\nSupabase URL이 올바른지 확인해주세요.';
      } else if (error.message.includes('401')) {
        errorMessage = 'API 키가 유효하지 않습니다.\n새로운 API 키가 필요할 수 있습니다.';
      }
      
      Alert.alert('연결 실패', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const checkUserExists = async () => {
    if (!email.trim()) {
      Alert.alert('오류', '이메일을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      
      // 비밀번호 재설정 요청으로 계정 존재 여부 간접 확인
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: process.env.EXPO_PUBLIC_APP_URL // 메인 앱으로 리다이렉트 (새 페이지가 자동 처리)
      });
      
      if (error) {
        console.error('[LoginScreen] 비밀번호 재설정 오류:', error);
        if (error.message.includes('User not found') || error.message.includes('Invalid email')) {
          Alert.alert(
            '계정 없음', 
            `${email} 계정이 존재하지 않습니다.\n\n회원가입을 먼저 진행해주세요.`
          );
        } else {
          Alert.alert('확인 실패', __DEV__ ? `오류: ${error.message}\n\n새로 회원가입해보세요.` : '확인 중 오류가 발생했습니다.');
        }
      } else {
        Alert.alert(
          '계정 존재 확인', 
          `${email} 계정이 존재합니다!\n\n비밀번호가 정확한지 다시 확인해주세요.\n\n(비밀번호 재설정 이메일도 발송되었습니다)`
        );
      }
    } catch (error) {
      console.error('[LoginScreen] 사용자 확인 오류:', error);
      Alert.alert('확인 실패', '사용자 확인 중 오류가 발생했습니다. 새로 회원가입해보세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = () => {
    // 게스트로 로그인 (보안 강화된 임시 사용자)
    const randomId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const timestamp = Date.now();
    const guestUser = {
      id: `guest_${timestamp}_${randomId}`,
      email: `guest_${randomId}@temp.local`,
      user_metadata: {
        username: `Guest_${randomId.substring(0, 8)}`,
        full_name: 'Guest User'
      },
      isGuest: true,
      expiresAt: timestamp + (24 * 60 * 60 * 1000) // 24시간 후 만료
    };
    
    if (__DEV__) {
    }
    
    if (onLoginSuccess) {
      onLoginSuccess(guestUser);
    }
  };

  const handleAdminLogin = () => {
    // 개발 환경에서만 관리자 로그인 허용
    if (!__DEV__) {
      Alert.alert('오류', '관리자 기능은 개발 환경에서만 사용 가능합니다.');
      return;
    }
    
    const adminUser = {
      id: 'admin_' + Date.now(),
      email: 'admin@arld.com',
      user_metadata: {
        username: 'Administrator',
        full_name: 'System Administrator'
      },
      role: 'admin'
    };
    
    
    if (onLoginSuccess) {
      onLoginSuccess(adminUser);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>{isLogin ? 'ARLD에 로그인하기' : 'ARLD에 회원가입하기'}</Text>
        </View>

        <View style={styles.form}>

        {!isLogin && (
          <View>
            <Text style={styles.inputLabel}>사용자명</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="사용자명"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                editable={!isLoading}
                maxLength={30}
              />
            </View>
          </View>
        )}

        <View>
          <Text style={styles.inputLabel}>이메일</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="이메일"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
              maxLength={100}
            />
          </View>
        </View>

        <View>
          <Text style={styles.inputLabel}>비밀번호</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="비밀번호"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={!isLoading}
              maxLength={100}
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
        </View>

        {!isLogin && (
          <View style={styles.agreementContainer}>
            <TouchableOpacity 
              style={styles.checkboxContainer}
              onPress={() => setAgreeToTerms(!agreeToTerms)}
            >
              <Ionicons 
                name={agreeToTerms ? "checkbox" : "square-outline"} 
                size={20} 
                color={agreeToTerms ? "#007AFF" : "#666"} 
              />
              <Text style={styles.checkboxText}>
                <Text 
                  style={styles.linkText} 
                  onPress={() => setTermsModalVisible(true)}
                >
                  서비스 이용약관
                </Text>에 동의합니다
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.checkboxContainer}
              onPress={() => setAgreeToPrivacy(!agreeToPrivacy)}
            >
              <Ionicons 
                name={agreeToPrivacy ? "checkbox" : "square-outline"} 
                size={20} 
                color={agreeToPrivacy ? "#007AFF" : "#666"} 
              />
              <Text style={styles.checkboxText}>
                <Text 
                  style={styles.linkText}
                  onPress={() => setPrivacyModalVisible(true)}
                >
                  개인정보처리방침
                </Text>에 동의합니다
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.checkboxContainer}
              onPress={() => setAgreeToFreedom(!agreeToFreedom)}
            >
              <Ionicons 
                name={agreeToFreedom ? "checkbox" : "square-outline"} 
                size={20} 
                color={agreeToFreedom ? "#007AFF" : "#666"} 
              />
              <Text style={styles.checkboxText}>
                표현의 자유에 동의합니다
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={isLogin ? handleLogin : handleSignup}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.primaryButtonText}>
              {isLogin ? '로그인' : '회원가입'}
            </Text>
          )}
        </TouchableOpacity>

        {isLogin && (
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => setIsLogin(false)}
            disabled={isLoading}
          >
            <Text style={styles.secondaryButtonText}>회원가입</Text>
          </TouchableOpacity>
        )}

        {!isLogin && (
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => setIsLogin(true)}
            disabled={isLoading}
          >
            <Text style={styles.secondaryButtonText}>로그인</Text>
          </TouchableOpacity>
        )}

        {/* 아이디/비밀번호 찾기 버튼들 (로그인 모드이고 로그인 오류 시에만 표시) */}
        {isLogin && (showAccountFind || showPasswordReset) && (
          <View style={styles.findButtonsContainer}>
            {showAccountFind && (
              <TouchableOpacity
                style={styles.findButton}
                onPress={handleAccountFind}
                disabled={isLoading}
              >
                <Text style={styles.findButtonText}>아이디 찾기</Text>
              </TouchableOpacity>
            )}
            {showPasswordReset && (
              <TouchableOpacity
                style={styles.findButton}
                onPress={handlePasswordReset}
                disabled={isLoading}
              >
                <Text style={styles.findButtonText}>비밀번호 찾기</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, styles.testButton]}
          onPress={() => setShowTestButtons(!showTestButtons)}
          disabled={isLoading}
        >
          <Text style={styles.testButtonText}>
            {showTestButtons ? '테스트 숨기기' : '테스트'}
          </Text>
        </TouchableOpacity>

        {showTestButtons && (
          <>
        {isLogin && (
          <TouchableOpacity
            style={styles.linkButton}
            onPress={handleResendEmail}
            disabled={isLoading}
          >
            <Text style={styles.linkText}>인증 이메일 재전송</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.button, styles.tertiaryButton]}
          onPress={async () => {
            if (!email.trim()) {
              Alert.alert('오류', '이메일을 입력해주세요.');
              return;
            }

            setIsLoading(true);
            try {
              
              // 1. 먼저 회원가입을 시도해서 계정 존재 여부 확인
              const { data: signupData, error: signupError } = await supabase.auth.signUp({
                email: email.trim(),
                password: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) // 랜덤 임시 비밀번호
              });
              
              
              let message = '';
              
              if (signupError) {
                if (signupError.message.includes('User already registered')) {
                  message = `✅ 계정이 존재합니다: ${email}\n\n`;
                  
                  // 2. 비밀번호 재설정으로 계정 상태 확인 (Rate limit 고려)
                  try {
                    const { data: resetData, error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
                      redirectTo: process.env.EXPO_PUBLIC_APP_URL
                    });
                    
                    if (resetError) {
                      if (resetError.message.includes('Email not confirmed')) {
                        message += '❌ 문제: 이메일 인증이 완료되지 않았습니다.\n\n해결방법: "인증 이메일 재전송" 버튼을 클릭하여 이메일을 확인하고 인증을 완료하세요.';
                      } else if (resetError.message.includes('For security purposes')) {
                        const match = resetError.message.match(/after (\d+) seconds/);
                        const seconds = match ? match[1] : '잠시';
                        message += `⚠️ 잠시 기다려주세요: ${seconds}초 후에 다시 시도할 수 있습니다.\n(너무 자주 요청하면 일시적으로 제한됩니다)`;
                      } else {
                        message += `❌ 계정 상태 오류: ${resetError.message}`;
                      }
                    } else {
                      message += '✅ 계정 상태: 정상\n✅ 비밀번호 재설정 이메일 발송됨\n\n문제: 입력한 비밀번호가 틀렸을 가능성이 높습니다.';
                    }
                  } catch (resetErr) {
                    message += '\n\n참고: 계정 상태 확인 중 일부 오류가 있었습니다.';
                  }
                } else {
                  message = `계정 확인 중 오류: ${signupError.message}`;
                }
              } else {
                message = `❌ 계정이 존재하지 않습니다: ${email}\n\n해결방법: 회원가입을 먼저 진행하세요.`;
              }
              
              Alert.alert('계정 상세 정보', message);
              
            } catch (error) {
              console.error('[LoginScreen] 계정 정보 확인 오류:', error);
              Alert.alert('오류', __DEV__ ? `계정 정보 확인 실패: ${error.message}` : '계정 정보 확인에 실패했습니다.');
            } finally {
              setIsLoading(false);
            }
          }}
          disabled={isLoading}
        >
          <Text style={styles.tertiaryButtonText}>계정 상세 정보 확인</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.tertiaryButton]}
          onPress={async () => {
            if (!email.trim()) {
              Alert.alert('오류', '이메일을 입력해주세요.');
              return;
            }

            setIsLoading(true);
            try {
              if (__DEV__) {
              }
              
              const { data, error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
                redirectTo: process.env.EXPO_PUBLIC_APP_URL
              });
              
              
              if (error) {
                console.error('[LoginScreen] 재설정 이메일 오류 상세:', error);
                throw error;
              }
              
              Alert.alert(
                '이메일 발송 완료',
                `${email}로 비밀번호 재설정 이메일을 발송했습니다.\n\n이메일의 링크를 클릭하면 새 창에서 비밀번호를 변경할 수 있습니다.\n\n이메일이 오지 않으면 스팸함도 확인해주세요.`
              );
            } catch (error) {
              console.error('[LoginScreen] 비밀번호 재설정 이메일 오류:', error);
              
              let errorMessage = `이메일 발송 실패: ${error.message}`;
              if (error.message.includes('Email rate limit exceeded')) {
                errorMessage = '이메일 발송 한도를 초과했습니다. 잠시 후 다시 시도해주세요.';
              } else if (error.message.includes('Invalid email')) {
                errorMessage = '유효하지 않은 이메일 주소입니다.';
              } else if (error.message.includes('User not found')) {
                errorMessage = '해당 이메일로 가입된 계정이 없습니다. 먼저 회원가입을 해주세요.';
              } else if (error.message.includes('Invalid API key')) {
                errorMessage = 'Supabase API 키 오류입니다. 설정을 확인해주세요.';
              } else if (error.message.includes('signup is disabled')) {
                errorMessage = 'Supabase 인증이 비활성화되어 있습니다.';
              } else if (error.message.includes('For security purposes')) {
                // Rate limit 에러 처리
                const match = error.message.match(/after (\d+) seconds/);
                const seconds = match ? match[1] : '잠시';
                errorMessage = `보안을 위해 ${seconds}초 후에 다시 시도해주세요.\n너무 자주 요청하면 일시적으로 제한됩니다.`;
              }
              
              Alert.alert('오류', errorMessage);
            } finally {
              setIsLoading(false);
            }
          }}
          disabled={isLoading}
        >
          <Text style={styles.tertiaryButtonText}>비밀번호 재설정 이메일 발송</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.tertiaryButton]}
          onPress={testSupabaseConnection}
          disabled={isLoading}
        >
          <Text style={styles.tertiaryButtonText}>Supabase 연결 테스트</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.tertiaryButton]}
          onPress={async () => {
            setIsLoading(true);
            try {
              
              // 1. users 테이블 확인
              const { data: usersData, error: usersError } = await supabase
                .from('users')
                .select('*')
                .limit(1);
              
              
              // 2. auth.users 테이블 확인 (시스템 테이블)
              const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
              
              // 3. 테이블 생성 시도
              if (usersError && usersError.message.includes('does not exist')) {
                
                const createTableSQL = `
                  CREATE TABLE IF NOT EXISTS public.users (
                    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
                    email TEXT UNIQUE NOT NULL,
                    username TEXT UNIQUE,
                    full_name TEXT,
                    avatar_url TEXT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                  );
                  
                  -- RLS 정책 설정
                  ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
                  
                  -- 사용자는 자신의 데이터만 볼 수 있음
                  CREATE POLICY "Users can view own profile" ON public.users 
                    FOR SELECT USING (auth.uid() = id);
                  
                  -- 사용자는 자신의 데이터만 업데이트할 수 있음
                  CREATE POLICY "Users can update own profile" ON public.users 
                    FOR UPDATE USING (auth.uid() = id);
                `;
                
                const { data: createResult, error: createError } = await supabase.rpc('exec_sql', {
                  sql: createTableSQL
                });
                
              }
              
              let message = '데이터베이스 스키마 확인 완료!\n\n';
              message += usersError ? `❌ users 테이블: ${usersError.message}\n` : '✅ users 테이블: 정상\n';
              message += authError ? `❌ 인증 시스템: ${authError.message}\n` : '✅ 인증 시스템: 정상\n';
              
              if (authUsers && authUsers.users) {
                message += `\n등록된 사용자 수: ${authUsers.users.length}명`;
              }
              
              Alert.alert('데이터베이스 상태', message);
              
            } catch (error) {
              console.error('[LoginScreen] DB 확인 오류:', error);
              Alert.alert('DB 확인 실패', __DEV__ ? `데이터베이스 확인 중 오류:\n${error.message}` : '데이터베이스 확인에 실패했습니다.');
            } finally {
              setIsLoading(false);
            }
          }}
          disabled={isLoading}
        >
          <Text style={styles.tertiaryButtonText}>데이터베이스 스키마 확인</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.tertiaryButton]}
          onPress={() => {
            try {
              // JWT 토큰 디코딩
              const base64Url = supabaseAnonKey.split('.')[1];
              const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
              const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
              }).join(''));
              
              const payload = JSON.parse(jsonPayload);
              const expDate = new Date(payload.exp * 1000);
              const now = new Date();
              
              Alert.alert(
                'API 키 정보',
                `발급자: ${payload.iss}\n프로젝트: ${payload.ref}\n역할: ${payload.role}\n발급: ${new Date(payload.iat * 1000).toLocaleString()}\n만료: ${expDate.toLocaleString()}\n현재: ${now.toLocaleString()}\n\n상태: ${now > expDate ? '만료됨' : '유효함'}`
              );
            } catch (error) {
              Alert.alert('오류', __DEV__ ? `JWT 디코딩 실패: ${error.message}` : 'API 키 정보 확인에 실패했습니다.');
            }
          }}
          disabled={isLoading}
        >
          <Text style={styles.tertiaryButtonText}>API 키 정보 확인</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.tertiaryButton]}
          onPress={async () => {
            if (!email.trim()) {
              Alert.alert('오류', '이메일을 입력해주세요.');
              return;
            }

            setIsLoading(true);
            try {
              
              // 실제로 존재하지 않는 사용자에게 재설정 이메일을 보내면 Supabase는 보안상 성공 응답을 줍니다
              // 하지만 실제로는 이메일이 발송되지 않습니다
              const { data, error } = await supabase.auth.resetPasswordForEmail('test@example.com', {
                redirectTo: process.env.EXPO_PUBLIC_APP_URL
              });
              
              
              if (!error) {
                Alert.alert(
                  '이메일 시스템 테스트',
                  'Supabase 이메일 시스템이 정상 작동 중입니다.\n\n실제 계정으로 다시 시도해보세요.\n\n참고: 존재하지 않는 계정은 보안상 이메일이 발송되지 않습니다.'
                );
              } else {
                throw error;
              }
            } catch (error) {
              console.error('[LoginScreen] 이메일 테스트 오류:', error);
              Alert.alert('이메일 시스템 오류', __DEV__ ? `이메일 시스템에 문제가 있습니다:\n${error.message}` : '이메일 시스템에 문제가 있습니다.');
            } finally {
              setIsLoading(false);
            }
          }}
          disabled={isLoading}
        >
          <Text style={styles.tertiaryButtonText}>이메일 시스템 테스트</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.tertiaryButton]}
          onPress={() => {
            Alert.prompt(
              '비밀번호 재설정 URL 입력',
              '전체 재설정 URL을 입력하세요\n(예: http://localhost:8081/#access_token=...)',
              [
                { text: '취소', style: 'cancel' },
                { 
                  text: '확인', 
                  onPress: async (url) => {
                    if (url && url.includes('access_token=')) {
                      setIsLoading(true);
                      try {
                        
                        // URL에서 토큰 추출
                        const hashPart = url.split('#')[1];
                        if (!hashPart) {
                          throw new Error('URL에 # 이후 부분이 없습니다.');
                        }
                        
                        const urlParams = new URLSearchParams(hashPart);
                        const accessToken = urlParams.get('access_token');
                        const refreshToken = urlParams.get('refresh_token');
                        
                        
                        if (accessToken) {
                          // 세션 설정
                          const { data, error } = await supabase.auth.setSession({
                            access_token: accessToken,
                            refresh_token: refreshToken
                          });
                          
                          if (error) {
                            console.error('[LoginScreen] 세션 설정 오류:', error);
                            throw error;
                          }
                          
                          
                          Alert.alert(
                            '성공', 
                            '인증이 완료되었습니다.\n새 비밀번호를 설정하세요.',
                            [{
                              text: '확인',
                              onPress: () => {
                                setIsLogin(false);
                                setEmail(data.user?.email || '');
                                setUsername(''); // 비밀번호 재설정 모드임을 표시
                              }
                            }]
                          );
                        } else {
                          Alert.alert('오류', 'URL에서 access_token을 찾을 수 없습니다.');
                        }
                      } catch (error) {
                        console.error('[LoginScreen] 수동 토큰 처리 오류:', error);
                        Alert.alert('오류', __DEV__ ? `토큰 처리 실패:\n${error.message}` : '토큰 처리에 실패했습니다.');
                      } finally {
                        setIsLoading(false);
                      }
                    } else {
                      Alert.alert('오류', '유효한 재설정 URL을 입력해주세요.');
                    }
                  }
                }
              ]
            );
          }}
          disabled={isLoading}
        >
          <Text style={styles.tertiaryButtonText}>재설정 URL 입력</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.adminButton]}
          onPress={handleAdminLogin}
          disabled={isLoading}
        >
          <Text style={styles.adminButtonText}>🔧 관리자 모드</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleGuestLogin}
          disabled={isLoading}
        >
          <Text style={styles.secondaryButtonText}>게스트로 계속하기</Text>
        </TouchableOpacity>
          </>
        )}
        </View>
      </ScrollView>

      {/* 이용약관 모달 */}
      <Modal
        visible={termsModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setTermsModalVisible(false)}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>서비스 이용약관</Text>
            <View style={{ width: 24 }} />
          </View>
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalText}>
              {/* 이용약관 내용 */}
              제1조 (목적){'\n'}
              본 약관은 ARLD가 제공하는 예술가 포트폴리오 및 소통 플랫폼 서비스의 이용과 관련하여 회사와 이용자의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.{'\n\n'}
              
              제2조 (정의){'\n'}
              • "서비스"란 회사가 제공하는 예술 작품 공유, 포트폴리오 관리, 사용자 간 소통 등의 모든 서비스를 의미합니다.{'\n'}
              • "회원"이란 본 약관에 동의하고 회원가입을 완료한 자를 말합니다.{'\n'}
              • "작품"이란 회원이 서비스에 업로드한 그림, 소설 등 모든 창작물을 의미합니다.{'\n\n'}
              
              제3조 (회원가입){'\n'}
              이용자는 회사가 정한 가입 양식에 따라 필요 정보를 기입한 후 본 약관에 동의한다는 의사표시를 함으로써 회원가입을 신청합니다.{'\n\n'}
              
              제4조 (서비스의 제공){'\n'}
              회사는 다음과 같은 서비스를 제공합니다:{'\n'}
              • 작품 업로드 및 포트폴리오 관리{'\n'}
              • 사용자 간 채팅 및 소통{'\n'}
              • 갤러리 생성 및 관리{'\n'}
              • 작품 검색 및 탐색{'\n\n'}
              
              제5조 (회원의 의무){'\n'}
              회원은 다음 행위를 하여서는 안 됩니다:{'\n'}
              • 타인의 저작권, 지적재산권을 침해하는 행위{'\n'}
              • 음란물을 업로드하거나 유포하는 행위{'\n'}
              • 타인을 비방하거나 명예를 손상시키는 행위{'\n'}
              • 서비스 운영을 방해하는 행위
            </Text>
          </ScrollView>
        </View>
      </Modal>

      {/* 개인정보처리방침 모달 */}
      <Modal
        visible={privacyModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setPrivacyModalVisible(false)}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>개인정보처리방침</Text>
            <View style={{ width: 24 }} />
          </View>
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalText}>
              {/* 개인정보처리방침 내용 */}
              1. 개인정보의 수집 및 이용목적{'\n'}
              ARLD는 다음의 목적을 위하여 개인정보를 처리합니다.{'\n'}
              • 회원 가입 및 관리{'\n'}
              • 서비스 제공 및 운영{'\n'}
              • 작품 업로드 및 포트폴리오 관리{'\n'}
              • 사용자 간 소통 지원{'\n\n'}
              
              2. 수집하는 개인정보 항목{'\n'}
              필수 항목:{'\n'}
              • 이메일 주소{'\n'}
              • 비밀번호{'\n'}
              • 사용자 이름(닉네임){'\n\n'}
              
              선택 항목:{'\n'}
              • 프로필 정보(자기소개){'\n'}
              • 작품 정보{'\n\n'}
              
              3. 개인정보의 보유 및 이용기간{'\n'}
              회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.{'\n'}
              • 회원 정보: 회원 탈퇴 시까지{'\n'}
              • 서비스 이용 기록: 3년{'\n\n'}
              
              4. 개인정보의 제3자 제공{'\n'}
              회사는 정보주체의 동의, 법률의 특별한 규정 등 개인정보 보호법 제17조 및 제18조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.{'\n\n'}
              
              5. 정보주체의 권리·의무{'\n'}
              이용자는 개인정보주체로서 다음과 같은 권리를 행사할 수 있습니다.{'\n'}
              • 개인정보 열람 요구{'\n'}
              • 오류 등이 있을 경우 정정 요구{'\n'}
              • 삭제 요구{'\n'}
              • 처리정지 요구
            </Text>
          </ScrollView>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F1E8',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'flex-start',
    marginTop: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 52,
    fontWeight: 'bold',
    color: '#000000',
    letterSpacing: -1,
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
  },
  subtitle: {
    fontSize: 16,
    color: '#000000',
    marginTop: 24,
    textAlign: 'left',
  },
  form: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    borderRadius: 0,
    marginBottom: 30,
    overflow: 'hidden',
    maxWidth: 280,
    alignSelf: 'center',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: 'transparent',
  },
  tabUnderline: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
    paddingBottom: 8,
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#007AFF',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E8E0D0', // 베ージ 톤에 맞는 테두리
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    borderWidth: 1,
    borderColor: '#007AFF',
    marginTop: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '400',
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
  tertiaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#666',
  },
  tertiaryButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '400',
  },
  adminButton: {
    backgroundColor: '#FF6B35',
    borderWidth: 2,
    borderColor: '#FF4500',
  },
  adminButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  testButton: {
    backgroundColor: '#34C759',
    borderWidth: 1,
    borderColor: '#34C759',
  },
  testButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    letterSpacing: -1,
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
    marginBottom: 8,
  },
  agreementContainer: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkboxText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  linkText: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F5F1E8',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E0D0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modalText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#333',
    paddingBottom: 40,
  },
  findButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  findButton: {
    flex: 1,
    alignItems: 'center',
  },
  findButtonText: {
    fontSize: 16,
    color: '#007AFF',
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
});