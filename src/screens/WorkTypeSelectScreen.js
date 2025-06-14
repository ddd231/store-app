import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import AnimatedButton from '../components/AnimatedButton';

export default function WorkTypeSelectScreen({ navigation }) {
  const workTypes = [
    {
      id: 'painting',
      title: '그림',
      description: '이미지를 업로드하여 그림 작품을 공유하세요',
      icon: 'color-palette',
      color: '#FF6B6B'
    },
    {
      id: 'novel',
      title: '소설',
      description: '텍스트로 소설이나 시 등을 작성하여 공유하세요',
      icon: 'book',
      color: '#4ECDC4'
    }
  ];

  const handleTypeSelect = (type) => {
    navigation.navigate('WorkUpload', { type });
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <AnimatedButton onPress={() => navigation.goBack()} animationType="scale">
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </AnimatedButton>
        <Text style={styles.headerTitle}>작품 유형 선택</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* 내용 */}
      <View style={styles.content}>
        <Text style={styles.subtitle}>어떤 종류의 작품을 업로드하시겠습니까?</Text>
        
        <View style={styles.typeContainer}>
          {workTypes.map((type) => (
            <AnimatedButton
              key={type.id}
              style={styles.typeCard}
              onPress={() => handleTypeSelect(type.id)}
              animationType="scale"
            >
              <View style={[styles.iconContainer, { backgroundColor: type.color }]}>
                <Ionicons name={type.icon} size={40} color="white" />
              </View>
              <Text style={styles.typeTitle}>{type.title}</Text>
              <Text style={styles.typeDescription}>{type.description}</Text>
              <View style={styles.arrowContainer}>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
              </View>
            </AnimatedButton>
          ))}
        </View>
      </View>
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
    paddingTop: theme.spacing.xl,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xxl,
  },
  typeContainer: {
    gap: theme.spacing.lg,
  },
  typeCard: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.large,
    padding: theme.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    position: 'relative',
    ...theme.shadows.medium,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  typeTitle: {
    ...theme.typography.heading,
    marginBottom: theme.spacing.sm,
  },
  typeDescription: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  arrowContainer: {
    position: 'absolute',
    top: theme.spacing.lg,
    right: theme.spacing.lg,
  },
});