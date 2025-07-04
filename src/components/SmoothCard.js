import React, { memo } from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS
} from 'react-native-reanimated';
import { theme } from '../styles/theme';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const SmoothCard = memo(function({ 
  children, 
  onPress, 
  style,
  disabled = false,
  shadowLevel = 'medium' // light, medium, heavy
}) {
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const shadowOpacity = useSharedValue(0.1);

  const animatedStyle = useAnimatedStyle(function() {
    return {
      transform: [
        { scale: scale.value },
        { translateY: translateY.value }
      ],
      shadowOpacity: shadowOpacity.value,
      elevation: interpolate(scale.value, [0.95, 1], [2, 8]),
    };
  });

  function handlePressIn() {
    if (disabled) return;
    
    scale.value = withSpring(0.98, {
      damping: 60,
      stiffness: 400,
      mass: 0.8,
    });
    
    translateY.value = withSpring(2, {
      damping: 60,
      stiffness: 400,
      mass: 0.8,
    });

    shadowOpacity.value = withTiming(0.2, {
      duration: 150,
    });
  };

  function handlePressOut() {
    if (disabled) return;
    
    scale.value = withSpring(1, {
      damping: 60,
      stiffness: 400,
      mass: 0.8,
    });
    
    translateY.value = withSpring(0, {
      damping: 60,
      stiffness: 400,
      mass: 0.8,
    });

    shadowOpacity.value = withTiming(0.1, {
      duration: 150,
    });
  };

  function handlePress() {
    if (disabled || !onPress) return;
    
    // 빠른 펄스 효과
    scale.value = withSpring(0.95, {
      damping: 100,
      stiffness: 800,
      mass: 0.5,
    }, function() {
      scale.value = withSpring(1, {
        damping: 60,
        stiffness: 400,
        mass: 0.8,
      });
    });

    runOnJS(onPress)();
  };

  function getShadowStyle() {
    switch (shadowLevel) {
      case 'light':
        return styles.lightShadow;
      case 'heavy':
        return styles.heavyShadow;
      default:
        return styles.mediumShadow;
    }
  };

  return (
    <AnimatedTouchable
      style={[
        styles.card,
        getShadowStyle(),
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
      {children}
    </AnimatedTouchable>
  );
});

SmoothCard.displayName = 'SmoothCard';

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
  },
  lightShadow: {
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  mediumShadow: {
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  heavyShadow: {
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
  },
  disabled: {
    opacity: 0.6,
  },
});

export default SmoothCard;
