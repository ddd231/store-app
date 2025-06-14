import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform, Animated, Easing } from 'react-native';
import { theme } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { upgradeToPremium } from '../utils/premiumUtils';

export default function UpgradeScreen({ navigation }) {
  const [selectedPlan, setSelectedPlan] = React.useState('premium');
  const buttonScale = React.useRef(new Animated.Value(1)).current;

  const freeBenefits = [
    '채팅 일일 5회 제한',
    '업로드 일일 2개 제한',
    '기본 검색 기능',
    '프로필 관리'
  ];

  const premiumBenefits = [
    '고급 검색 및 필터',
    '사용자 숨김 기능',
    '검색 기록 저장',
    '북마크 기능',
    '우선 지원'
  ];

  const animateButtonPress = () => {
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

  const handlePurchase = () => {
    animateButtonPress();
    setTimeout(() => {
      Alert.alert(
        '결제 확인',
        '전문가 멤버십을 월 3,000원에 구독하시겠습니까?',
        [
          { text: '취소', style: 'cancel' },
          {
            text: '결제하기',
            onPress: async () => {
              const success = await upgradeToPremium(1); // 1개월 구독
              if (success) {
                Alert.alert('결제 완료', '전문가 멤버십이 활성화되었습니다!');
                navigation.goBack();
              } else {
                Alert.alert('오류', '결제 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
              }
            }
          }
        ]
      );
    }, 100);
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>업그레이드</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* 플랜 비교 */}
        <View style={styles.plansContainer}>
          {/* Premium Plan */}
          <View style={[styles.planCard, styles.premiumCard]}>
            <View style={styles.planHeader}>
              <Text style={[styles.planTitle, styles.premiumTitle]}>Premium</Text>
              <Text style={[styles.planPrice, styles.premiumPrice]}>₩3,000</Text>
              <Text style={styles.planPeriod}>월</Text>
            </View>
            <View style={styles.planBenefits}>
              {premiumBenefits.map((benefit, index) => (
                <View key={index} style={styles.benefitRow}>
                  <Ionicons name="checkmark" size={16} color="#007AFF" />
                  <Text style={styles.benefitText}>{benefit}</Text>
                </View>
              ))}
            </View>
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity style={[styles.planButton, styles.premiumButton]} onPress={handlePurchase}>
                <Text style={styles.premiumButtonText}>Premium 시작하기</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 60,
    paddingBottom: theme.spacing.md,
  },
  headerTitle: {
    ...theme.typography.subheading,
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 22,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 50,
  },
  titleSection: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  mainTitle: {
    ...theme.typography.heading,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  plansContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginTop: -theme.spacing.xl * 2,
  },
  planCard: {
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.large,
    padding: theme.spacing.lg,
    borderWidth: 2,
    borderColor: '#E5E5E7',
  },
  premiumCard: {
    borderColor: '#007AFF',
  },
  selectedPlan: {
    borderColor: '#007AFF',
    backgroundColor: '#F8F9FF',
  },
  planHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  planTitle: {
    ...theme.typography.subheading,
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
  },
  premiumTitle: {
    color: '#007AFF',
  },
  planPrice: {
    ...theme.typography.title,
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
  },
  premiumPrice: {
    color: '#007AFF',
  },
  planPeriod: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
  },
  planBenefits: {
    marginBottom: theme.spacing.lg,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  benefitText: {
    ...theme.typography.body,
    marginLeft: theme.spacing.sm,
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
  },
  planButton: {
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
  },
  freeButton: {
    backgroundColor: '#F5F5F7',
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  premiumButton: {
    backgroundColor: '#007AFF',
  },
  freeButtonText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  premiumButtonText: {
    ...theme.typography.body,
    color: 'white',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
  },
});