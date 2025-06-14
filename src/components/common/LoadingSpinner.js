import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { theme } from '../../styles/theme';

const LoadingSpinner = ({ 
  size = 'large',
  color = theme.colors.primary,
  text,
  fullScreen = false,
  style,
}) => {
  const content = (
    <View style={[styles.container, fullScreen && styles.fullScreen, style]}>
      <ActivityIndicator size={size} color={color} />
      {text && <Text style={styles.text}>{text}</Text>}
    </View>
  );

  return content;
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  fullScreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.background,
    zIndex: 9999,
  },
  text: {
    marginTop: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
});

export default LoadingSpinner;