import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS
} from 'react-native-reanimated';
import { theme } from '../styles/theme';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

function SmoothButton({ 
  onPress, 
  title, 
  style, 
  textStyle,
  disabled = false,
  variant = 'primary' // primary, secondary, outline
}) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(function() {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  function handlePressIn() {
    if (disabled) return;
    
    scale.value = withSpring(0.95, {
      damping: 50,
      stiffness: 400,
      mass: 0.8,
    });
    
    opacity.value = withTiming(0.8, {
      duration: 150,
    });
  };

  function handlePressOut() {
    if (disabled) return;
    
    scale.value = withSpring(1, {
      damping: 50,
      stiffness: 400,
      mass: 0.8,
    });
    
    opacity.value = withTiming(1, {
      duration: 150,
    });
  };

  function handlePress() {
    if (disabled || !onPress) return;
    
    // 애니메이션과 함께 onPress 실행
    scale.value = withSpring(0.9, {
      damping: 100,
      stiffness: 800,
      mass: 0.5,
    }, function() {
      scale.value = withSpring(1, {
        damping: 50,
        stiffness: 400,
        mass: 0.8,
      });
    });

    runOnJS(onPress)();
  };

  function getButtonStyle() {
    switch (variant) {
      case 'secondary':
        return [styles.button, styles.secondaryButton];
      case 'outline':
        return [styles.button, styles.outlineButton];
      default:
        return [styles.button, styles.primaryButton];
    }
  };

  function getTextStyle() {
    switch (variant) {
      case 'secondary':
        return [styles.text, styles.secondaryText];
      case 'outline':
        return [styles.text, styles.outlineText];
      default:
        return [styles.text, styles.primaryText];
    }
  };

  return (
    <AnimatedTouchable
      style={[
        getButtonStyle(),
        animatedStyle,
        style,
        disabled && styles.disabled
      ]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={1}
    >
      <Text style={[getTextStyle(), textStyle, disabled && styles.disabledText]}>
        {title}
      </Text>
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
  },
  secondaryButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  text: {
    ...theme.typography.body,
    fontWeight: '600',
  },
  primaryText: {
    color: 'white',
  },
  secondaryText: {
    color: theme.colors.text.primary,
  },
  outlineText: {
    color: theme.colors.primary,
  },
  disabled: {
    backgroundColor: theme.colors.text.secondary,
    shadowOpacity: 0,
    elevation: 0,
  },
  disabledText: {
    color: 'white',
  },
});

export default SmoothButton;