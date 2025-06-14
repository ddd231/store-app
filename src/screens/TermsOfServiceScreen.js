import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';

export default function TermsOfServiceScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>이용약관</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>최종 수정일: 2025년 6월 10일</Text>

        <Text style={styles.sectionTitle}>제1조 (목적)</Text>
        <Text style={styles.paragraph}>
          본 약관은 ARLD(이하 '회사')가 제공하는 예술가 포트폴리오 및 소통 플랫폼 서비스(이하 '서비스')의 이용과 관련하여 회사와 이용자의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
        </Text>

        <Text style={styles.sectionTitle}>제2조 (정의)</Text>
        <Text style={styles.listItem}>• "서비스"란 회사가 제공하는 예술 작품 공유, 포트폴리오 관리, 사용자 간 소통 등의 모든 서비스를 의미합니다.</Text>
        <Text style={styles.listItem}>• "회원"이란 본 약관에 동의하고 회원가입을 완료한 자를 말합니다.</Text>
        <Text style={styles.listItem}>• "작품"이란 회원이 서비스에 업로드한 그림, 소설 등 모든 창작물을 의미합니다.</Text>

        <Text style={styles.sectionTitle}>제3조 (약관의 효력 및 변경)</Text>
        <Text style={styles.paragraph}>
          ① 본 약관은 서비스 화면에 게시하거나 기타의 방법으로 회원에게 공지함으로써 효력이 발생합니다.
        </Text>
        <Text style={styles.paragraph}>
          ② 회사는 필요한 경우 관련 법령을 위배하지 않는 범위에서 본 약관을 개정할 수 있습니다.
        </Text>

        <Text style={styles.sectionTitle}>제4조 (회원가입)</Text>
        <Text style={styles.paragraph}>
          ① 이용자는 회사가 정한 가입 양식에 따라 필요 정보를 기입한 후 본 약관에 동의한다는 의사표시를 함으로써 회원가입을 신청합니다.
        </Text>
        <Text style={styles.paragraph}>
          ② 회사는 다음 각 호에 해당하는 신청에 대하여는 승낙을 하지 않거나 사후에 이용계약을 해지할 수 있습니다.
        </Text>
        <Text style={styles.listItem}>• 가입신청자가 본 약관에 의하여 이전에 회원자격을 상실한 적이 있는 경우</Text>
        <Text style={styles.listItem}>• 타인의 정보를 이용한 경우</Text>
        <Text style={styles.listItem}>• 허위의 정보를 기재한 경우</Text>

        <Text style={styles.sectionTitle}>제5조 (서비스의 제공)</Text>
        <Text style={styles.paragraph}>
          회사는 다음과 같은 서비스를 제공합니다:
        </Text>
        <Text style={styles.listItem}>• 작품 업로드 및 포트폴리오 관리</Text>
        <Text style={styles.listItem}>• 사용자 간 채팅 및 소통</Text>
        <Text style={styles.listItem}>• 갤러리 생성 및 관리</Text>
        <Text style={styles.listItem}>• 작품 검색 및 탐색</Text>

        <Text style={styles.sectionTitle}>제6조 (회원의 의무)</Text>
        <Text style={styles.paragraph}>
          ① 회원은 다음 행위를 하여서는 안 됩니다:
        </Text>
        <Text style={styles.listItem}>• 타인의 저작권, 지적재산권을 침해하는 행위</Text>
        <Text style={styles.listItem}>• 음란물을 업로드하거나 유포하는 행위</Text>
        <Text style={styles.listItem}>• 타인을 비방하거나 명예를 손상시키는 행위</Text>
        <Text style={styles.listItem}>• 서비스 운영을 방해하는 행위</Text>

        <Text style={styles.sectionTitle}>제7조 (저작권)</Text>
        <Text style={styles.paragraph}>
          ① 회원이 서비스에 업로드한 작품의 저작권은 해당 회원에게 있습니다.
        </Text>
        <Text style={styles.paragraph}>
          ② 회원은 서비스에 작품을 업로드함으로써 회사가 해당 작품을 서비스 운영 목적으로 사용할 수 있도록 허락합니다.
        </Text>

        <Text style={styles.sectionTitle}>제8조 (서비스의 중단)</Text>
        <Text style={styles.paragraph}>
          회사는 다음 각 호에 해당하는 경우 서비스 제공을 일시적으로 중단할 수 있습니다:
        </Text>
        <Text style={styles.listItem}>• 시스템 점검, 보수, 교체의 경우</Text>
        <Text style={styles.listItem}>• 천재지변 등 불가항력적 사유가 발생한 경우</Text>

        <Text style={styles.sectionTitle}>제9조 (회원탈퇴 및 자격 상실)</Text>
        <Text style={styles.paragraph}>
          ① 회원은 언제든지 탈퇴를 요청할 수 있으며, 회사는 즉시 회원탈퇴를 처리합니다.
        </Text>
        <Text style={styles.paragraph}>
          ② 회원이 본 약관을 위반한 경우 회사는 회원자격을 제한 또는 상실시킬 수 있습니다.
        </Text>

        <Text style={styles.sectionTitle}>제10조 (면책조항)</Text>
        <Text style={styles.paragraph}>
          회사는 천재지변, 전쟁 및 기타 불가항력으로 인하여 서비스를 제공할 수 없는 경우 서비스 제공에 대한 책임이 면제됩니다.
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
  lastUpdated: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    ...theme.typography.subheading,
    fontWeight: '600',
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.md,
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