import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { useNavigation } from '@react-navigation/native';

const Header = ({ 
  title,
  showBack = true,
  onBack,
  rightComponent,
  leftComponent,
  centerComponent,
  style,
  titleStyle,
}) => {
  const navigation = useNavigation();
  
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.left}>
        {leftComponent || (
          showBack && (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
          )
        )}
      </View>
      
      <View style={styles.center}>
        {centerComponent || (
          title && <Text style={[styles.title, titleStyle]}>{title}</Text>
        )}
      </View>
      
      <View style={styles.right}>
        {rightComponent}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xs,
    paddingTop: 60,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  left: {
    flex: 1,
    alignItems: 'flex-start',
  },
  center: {
    flex: 2,
    alignItems: 'center',
  },
  right: {
    flex: 1,
    alignItems: 'flex-end',
  },
  backButton: {
    padding: theme.spacing.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
});

export default Header;