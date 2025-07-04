import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import AnimatedButton from '../../../components/AnimatedButton';
import { useLanguage } from '../../../contexts/LanguageContext';

function WorkTypeSelectScreen({ navigation }) {
  const { t } = useLanguage();
  const workTypes = [
    {
      id: 'painting',
      title: t('painting'),
      description: t('paintingDescription'),
      icon: 'color-palette',
      color: '#FF6B6B'
    },
    {
      id: 'novel',
      title: t('novel'),
      description: t('novelDescription'),
      icon: 'book',
      color: '#4ECDC4'
    }
  ];

  function handleTypeSelect(type) {
    navigation.navigate('WorkUpload', { type });
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <AnimatedButton onPress={function() { navigation.goBack(); }} animationType="scale">
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </AnimatedButton>
        <Text style={styles.headerTitle}>{t('selectWorkType')}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* 내용 */}
      <View style={styles.content}>
        <Text style={styles.subtitle}>{t('selectWorkTypeSubtitle')}</Text>
        
        <View style={styles.typeContainer}>
          {workTypes.map(function(type) { return (
            <AnimatedButton
              key={type.id}
              style={styles.typeCard}
              onPress={function() { handleTypeSelect(type.id); }}
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
          ); })}
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
    fontSize: 20,
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
    marginBottom: theme.spacing.lg,
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

export default WorkTypeSelectScreen;