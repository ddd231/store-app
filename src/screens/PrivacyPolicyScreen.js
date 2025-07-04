import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';

function PrivacyPolicyScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={function() { navigation.goBack(); }}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>개인정보처리방침</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.lastUpdated}>최종 수정일: 2025년 6월 10일</Text>

        <Text style={styles.sectionTitle}>1. 개인정보의 수집 및 이용목적</Text>
        <Text style={styles.paragraph}>
          ARLD(이하 '회사')는 다음의 목적을 위하여 개인정보를 처리합니다.
        </Text>
        <Text style={styles.listItem}>• 회원 가입 및 관리</Text>
        <Text style={styles.listItem}>• 서비스 제공 및 운영</Text>
        <Text style={styles.listItem}>• 작품 업로드 및 포트폴리오 관리</Text>
        <Text style={styles.listItem}>• 사용자 간 소통 지원</Text>

        <Text style={styles.sectionTitle}>2. 수집하는 개인정보 항목</Text>
        <Text style={styles.subTitle}>필수 항목</Text>
        <Text style={styles.listItem}>• 이메일 주소</Text>
        <Text style={styles.listItem}>• 비밀번호</Text>
        <Text style={styles.listItem}>• 사용자 이름(닉네임)</Text>
        
        <Text style={styles.subTitle}>선택 항목</Text>
        <Text style={styles.listItem}>• 프로필 정보(자기소개)</Text>
        <Text style={styles.listItem}>• 작품 정보</Text>

        <Text style={styles.sectionTitle}>3. 개인정보의 보유 및 이용기간</Text>
        <Text style={styles.paragraph}>
          회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.
        </Text>
        <Text style={styles.listItem}>• 회원 정보: 회원 탈퇴 시까지</Text>
        <Text style={styles.listItem}>• 서비스 이용 기록: 3년</Text>

        <Text style={styles.sectionTitle}>4. 개인정보의 제3자 제공</Text>
        <Text style={styles.paragraph}>
          회사는 정보주체의 동의, 법률의 특별한 규정 등 개인정보 보호법 제17조 및 제18조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.
        </Text>

        <Text style={styles.sectionTitle}>5. 개인정보처리 위탁</Text>
        <Text style={styles.paragraph}>
          회사는 서비스 제공을 위하여 필요한 범위 내에서 다음과 같이 개인정보 처리업무를 위탁하고 있습니다.
        </Text>
        <Text style={styles.listItem}>• Supabase: 데이터베이스 및 인증 서비스</Text>

        <Text style={styles.sectionTitle}>6. 정보주체의 권리·의무</Text>
        <Text style={styles.paragraph}>
          이용자는 개인정보주체로서 다음과 같은 권리를 행사할 수 있습니다.
        </Text>
        <Text style={styles.listItem}>• 개인정보 열람 요구</Text>
        <Text style={styles.listItem}>• 오류 등이 있을 경우 정정 요구</Text>
        <Text style={styles.listItem}>• 삭제 요구</Text>
        <Text style={styles.listItem}>• 처리정지 요구</Text>

        <Text style={styles.sectionTitle}>7. 개인정보의 파기</Text>
        <Text style={styles.paragraph}>
          회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.
        </Text>

        <Text style={styles.sectionTitle}>8. 개인정보 보호책임자</Text>
        <Text style={styles.paragraph}>
          개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
        </Text>
        <Text style={styles.listItem}>• 이메일: privacy@arld.app</Text>

        <Text style={styles.sectionTitle}>9. 개인정보 처리방침 변경</Text>
        <Text style={styles.paragraph}>
          이 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.
        </Text>

        <View style={{ height: 50 }} />
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
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    ...theme.typography.heading,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  lastUpdated: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    ...theme.typography.subheading,
    fontWeight: '600',
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.md,
  },
  subTitle: {
    ...theme.typography.body,
    fontWeight: '600',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  paragraph: {
    ...theme.typography.body,
    lineHeight: 24,
    marginBottom: theme.spacing.md,
    color: theme.colors.text.primary,
  },
  listItem: {
    ...theme.typography.body,
    lineHeight: 24,
    marginBottom: theme.spacing.xs,
    marginLeft: theme.spacing.md,
    color: theme.colors.text.primary,
  },
});

export default PrivacyPolicyScreen;