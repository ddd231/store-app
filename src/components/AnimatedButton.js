import React, { useRef, memo } from 'react';
import { TouchableOpacity, Animated, Text } from 'react-native';

function AnimatedButton({ 
  children, 
  onPress, 
  onLongPress,
  style, 
  textStyle, 
  disabled = false,
  animationType = 'scale', // scale, fade, slide, pulse, elastic, none
  disableAnimation = false
}) {
  const animatedValue = useRef(new Animated.Value(1)).current;
  const opacityValue = useRef(new Animated.Value(1)).current;
  const translateValue = useRef(new Animated.Value(0)).current;

  function handlePressIn() {
    if (disabled || disableAnimation || animationType === 'none') return;

    if (animationType === 'scale') {
      Animated.timing(animatedValue, {
        toValue: 0.98,
        duration: 50,
        useNativeDriver: true,
      }).start();
    } else if (animationType === 'fade') {
      Animated.timing(opacityValue, {
        toValue: 0.7,
        duration: 50,
        useNativeDriver: true,
      }).start();
    } else if (animationType === 'slide') {
      Animated.timing(translateValue, {
        toValue: 2,
        duration: 50,
        useNativeDriver: true,
      }).start();
    } else if (animationType === 'pulse') {
      Animated.timing(animatedValue, {
        toValue: 1.02,
        duration: 50,
        useNativeDriver: true,
      }).start();
    } else if (animationType === 'elastic') {
      Animated.timing(animatedValue, {
        toValue: 0.95,
        duration: 50,
        useNativeDriver: true,
      }).start();
    }
  };

  function handlePressOut() {
    if (disabled || disableAnimation || animationType === 'none') return;

    if (animationType === 'scale') {
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    } else if (animationType === 'fade') {
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }).start();
    } else if (animationType === 'slide') {
      Animated.timing(translateValue, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    } else if (animationType === 'pulse') {
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    } else if (animationType === 'elastic') {
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  };

  const animatedStyle = {
    transform: [
      { scale: animatedValue },
      { translateX: translateValue }
    ],
    opacity: animationType === 'fade' ? opacityValue : 1,
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      activeOpacity={1}
    >
      <Animated.View style={[style, animatedStyle]}>
        {typeof children === 'string' ? (
          <Text style={textStyle}>{children}</Text>
        ) : (
          children
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

AnimatedButton.displayName = 'AnimatedButton';

export default memo(AnimatedButton);