import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { theme } from '../../styles/theme';

const Button = ({ 
  title, 
  onPress, 
  variant = 'primary', // primary, secondary, outline, text
  size = 'medium', // small, medium, large
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
  ...props 
}) => {
  const isDisabled = disabled || loading;

  const getButtonStyle = () => {
    const baseStyle = [styles.button, styles[`button_${size}`]];
    
    switch (variant) {
      case 'primary':
        baseStyle.push(styles.buttonPrimary);
        if (isDisabled) baseStyle.push(styles.buttonDisabled);
        break;
      case 'secondary':
        baseStyle.push(styles.buttonSecondary);
        if (isDisabled) baseStyle.push(styles.buttonDisabled);
        break;
      case 'outline':
        baseStyle.push(styles.buttonOutline);
        if (isDisabled) baseStyle.push(styles.buttonOutlineDisabled);
        break;
      case 'text':
        baseStyle.push(styles.buttonText);
        break;
    }
    
    return [...baseStyle, style];
  };

  const getTextStyle = () => {
    const baseStyle = [styles.text, styles[`text_${size}`]];
    
    switch (variant) {
      case 'primary':
      case 'secondary':
        baseStyle.push(styles.textLight);
        break;
      case 'outline':
        baseStyle.push(styles.textDark);
        if (isDisabled) baseStyle.push(styles.textDisabled);
        break;
      case 'text':
        baseStyle.push(styles.textPrimary);
        break;
    }
    
    return [...baseStyle, textStyle];
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator 
          size={size === 'small' ? 'small' : 'small'} 
          color={variant === 'outline' || variant === 'text' ? theme.colors.primary : 'white'} 
        />
      ) : (
        <>
          {icon && icon}
          <Text style={getTextStyle()}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.full,
  },
  
  // Variants
  buttonPrimary: {
    backgroundColor: theme.colors.primary,
  },
  buttonSecondary: {
    backgroundColor: theme.colors.surface,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  buttonText: {
    backgroundColor: 'transparent',
  },
  buttonDisabled: {
    backgroundColor: theme.colors.surface,
    opacity: 0.5,
  },
  buttonOutlineDisabled: {
    borderColor: theme.colors.border,
    opacity: 0.5,
  },
  
  // Sizes
  button_small: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    minHeight: 32,
  },
  button_medium: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    minHeight: 44,
  },
  button_large: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    minHeight: 56,
  },
  
  // Text
  text: {
    fontWeight: '600',
  },
  text_small: {
    fontSize: 14,
  },
  text_medium: {
    fontSize: 16,
  },
  text_large: {
    fontSize: 18,
  },
  textLight: {
    color: 'white',
  },
  textDark: {
    color: theme.colors.text.primary,
  },
  textPrimary: {
    color: theme.colors.primary,
  },
  textDisabled: {
    color: theme.colors.text.secondary,
  },
});

export default Button;