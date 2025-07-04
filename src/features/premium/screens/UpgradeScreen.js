import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform, Animated, Easing } from 'react-native';
import { theme } from '../../../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { 
  requestSubscription,
  useIAP
} from 'react-native-iap';
import { supabase } from '../../../shared';
import { useAuth } from '../../auth/hooks/useAuth';
import { logger } from '../../../shared';

export default function UpgradeScreen({ navigation }) {
  const [selectedPlan, setSelectedPlan] = React.useState('premium');
  const [purchaseLoading, setPurchaseLoading] = React.useState(false);
  const buttonScale = React.useRef(new Animated.Value(1)).current;
  const { refreshUserProfile } = useAuth();
  
  // 2025년 최신 useIAP Hook 사용
  const {
    connected,
    subscriptions,
    getSubscriptions,
    currentPurchase,
    currentPurchaseError,
    initConnectionError,
    finishTransaction
  } = useIAP();

  // 2025년 최신 useIAP Hook으로 초기화 및 구독 로드
  React.useEffect(function() {
    if (!connected) {
      logger.log('IAP 연결 대기 중...');
      return;
    }
    
    logger.log('✅ IAP 연결 성공, 구독 상품 로드 시작...');
    
    async function fetchSubscriptions() {
      try {
        await getSubscriptions({ skus: ['expertaccount'] });
        logger.log('✅ 구독 상품 로드 성공');
      } catch (error) {
        console.error('구독 상품 로드 실패:', error);
      }
    };
    
    fetchSubscriptions();
  }, [connected, getSubscriptions]);

  // 현재 구매 처리 (2025년 최신 패턴)
  React.useEffect(function() {
    if (currentPurchase) {
      handlePurchaseUpdate(currentPurchase);
    }
  }, [currentPurchase]);

  // 구매 오류 처리
  React.useEffect(function() {
    if (currentPurchaseError) {
      console.error('구매 오류:', currentPurchaseError);
      setPurchaseLoading(false);
      Alert.alert(
        '구매 실패',
        `구매 중 오류가 발생했습니다: ${currentPurchaseError.message}`
      );
    }
  }, [currentPurchaseError]);

  // 구매 업데이트 처리 함수
  async function handlePurchaseUpdate(purchase) {
    logger.log('구매 업데이트 수신:', purchase);
    
    try {
      // 구매 상태 검증
      const isPurchased = Platform.OS === 'android' 
        ? purchase.purchaseStateAndroid === 1 
        : purchase.transactionReceipt;
      
      if (isPurchased) {
        // 서버 검증 실행
        await activateSubscription(purchase);
        
        // 플랫폼별 트랜잭션 완료
        await finishTransaction({ purchase, isConsumable: false });
        
        // 사용자 프로필 새로고침 후 네비게이션
        logger.log('🔄 사용자 프로필 새로고침 중...');
        await refreshUserProfile();
        
        // 프리미엄 상태 확인 후 네비게이션
        setTimeout(function() {
          logger.log('🚀 홈으로 이동 시작...');
          navigation.reset({
            index: 0,
            routes: [{ name: 'Home', params: { premiumUpdated: true } }],
          });
          logger.log('🚀 홈으로 이동 완료!');
          
          // 성공 메시지 표시
          setTimeout(function() {
            Alert.alert(
              '구독 완료',
              '프리미엄 구독이 활성화되었습니다!'
            );
          }, 500);
        }, 1000); // 상태 업데이트 완료 후 네비게이션
        
      } else {
        console.warn('구매가 완료되지 않음:', purchase);
      }
    } catch (error) {
      console.error('구매 처리 실패:', error);
      Alert.alert(
        '구매 검증 실패',
        '구매는 완료되었지만 검증에 실패했습니다. 고객 지원에 문의하세요.'
      );
    } finally {
      setPurchaseLoading(false);
    }
  };


  const freeBenefits = [
    '채팅 일일 5회 제한',
    '업로드 일일 2개 제한',
    '기본 검색 기능',
    '프로필 관리'
  ];

  const premiumBenefits = [
    { icon: 'person-remove-outline', text: '사용자 숨김' },
    { icon: 'time-outline', text: '검색 기록 저장' },
    { icon: 'bookmark-outline', text: '북마크' },
    { icon: 'trophy-outline', text: '컨테스트 게시판 업로드 기능' },
    { icon: 'briefcase-outline', text: '채용·협업 공고 업로드 기능' },
    { icon: 'people-outline', text: '우선 고객 지원' }
  ];

  function animateButtonPress() {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 200,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 200,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
        useNativeDriver: true,
      })
    ]).start();
  };

  // 구독 활성화 함수 - 서버 검증 포함 (fallback 지원)
  async function activateSubscription(purchase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('사용자 정보를 찾을 수 없습니다.');
    
    let serverVerificationSuccess = false;
    
    try {
      // 서버사이드 구매 검증 시도
      const { data, error } = await supabase.functions.invoke('verify-googleplaypay', {
        body: {
          purchaseToken: purchase.purchaseToken,
          productId: purchase.productId || 'expertaccount',
          packageName: 'com.anonymous.portfoliochatapp',
          userId: user.id
        }
      });

      if (error) {
        console.warn('서버 검증 실패, fallback 로직 사용:', error);
      } else if (data?.success) {
        logger.log('구매 검증 성공:', data);
        serverVerificationSuccess = true;
        
        // ✅ 구매 성공 후 사용자 프로필 새로 불러오기 (useAuth의 전역 상태 업데이트)
        await refreshUserProfile();
      }
    } catch (error) {
      console.warn('서버 검증 오류, fallback 로직 사용:', error);
    }
    
    // 서버 검증 실패 시 에러 처리 (더 이상 임시 활성화 안함)
    if (!serverVerificationSuccess) {
      logger.error('서버 검증 실패: 프리미엄 활성화 불가');
      throw new Error('구매 검증에 실패했습니다. 고객 지원에 문의하세요.');
    }
    
    // 프로필 새로고침
    await refreshUserProfile();
  };


  // 인앱결제 기능
  // 2025년 최신 구독 구매 실행
  async function handlePurchase() {
    if (purchaseLoading || !connected) return;
    
    animateButtonPress();
    setPurchaseLoading(true);
    
    try {
      logger.log('구독 구매 시작...');
      
      // 2025년 최신 방법: requestSubscription 사용
      await requestSubscription({
        sku: 'expertaccount',
        ...(Platform.OS === 'android' && {
          subscriptionOffers: [
            {
              sku: 'expertaccount',
              offerToken: subscriptions?.[0]?.subscriptionOfferDetails?.[0]?.offerToken
            }
          ]
        })
      });
      
      logger.log('구독 요청 완료, 구매 업데이트 대기 중...');
      
    } catch (error) {
      console.error('구매 요청 실패:', error);
      setPurchaseLoading(false);
      
      Alert.alert(
        '구매 실패',
        `구매 요청에 실패했습니다: ${error.message}`
      );
    }
  };


  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={function() { navigation.goBack(); }}>
          <Ionicons name="chevron-back" size={28} color="white" />
        </TouchableOpacity>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 제목 섹션 */}
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>Subscription</Text>
          <Text style={styles.priceTitle}>₩3,000</Text>
        </View>

        {/* 혜택 목록 */}
        <View style={styles.benefitsContainer}>
          {premiumBenefits.map(function(benefit, index) { return (
            <View key={index} style={styles.benefitRow}>
              <Ionicons name={benefit.icon} size={24} color="white" style={styles.benefitIcon} />
              <Text style={styles.benefitText}>{benefit.text}</Text>
            </View>
          ); })}
        </View>

        {/* Premium 버튼 */}
        <View style={styles.buttonContainer}>
          <Animated.View style={{ transform: [{ scale: buttonScale }], width: '100%' }}>
            <TouchableOpacity 
              style={[styles.premiumButton, purchaseLoading && styles.premiumButtonDisabled]} 
              onPress={handlePurchase}
              disabled={purchaseLoading}
            >
              <Text style={styles.premiumButtonText}>
                {purchaseLoading ? '구매 처리 중...' : '업그레이드'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1E',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  titleSection: {
    alignItems: 'flex-start',
    marginTop: 40,
    marginBottom: 40,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  priceTitle: {
    fontSize: 28,
    fontWeight: '400',
    color: 'white',
  },
  benefitsContainer: {
    marginBottom: 50,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  benefitIcon: {
    width: 32,
    marginRight: 16,
  },
  benefitText: {
    fontSize: 18,
    color: 'white',
    fontWeight: '300',
    flex: 1,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  premiumButton: {
    backgroundColor: '#FF9500',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  premiumButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  premiumButtonDisabled: {
    opacity: 0.6,
  },
});

