import { useState, useRef } from 'react';
import { Animated } from 'react-native';

export function useHomeAnimations() {
  const [filterVisible, setFilterVisible] = useState(false);
  const [modalAnimating, setModalAnimating] = useState(false);
  const modalSlideAnim = useRef(new Animated.Value(600)).current;
  const backdropOpacityAnim = useRef(new Animated.Value(0)).current;

  // 모달 열기 애니메이션
  function openModal() {
    setFilterVisible(true);
    setModalAnimating(true);
    
    // 백드롭 페이드인과 모달 슬라이드업을 동시에 시작
    Animated.parallel([
      Animated.timing(backdropOpacityAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: false,
      }),
      Animated.timing(modalSlideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(function() {
      setModalAnimating(false);
    });
  }

  // 모달 닫기 애니메이션
  function closeModal() {
    // 모달만 스프링으로 빠르게 내리고 배경은 따로
    Animated.spring(modalSlideAnim, {
      toValue: 600,
      tension: 200,
      friction: 8,
      useNativeDriver: true,
    }).start();
    
    Animated.timing(backdropOpacityAnim, {
      toValue: 0,
      duration: 50,
      useNativeDriver: false,
    }).start(function() {
      setFilterVisible(false);
    });
  }

  return {
    filterVisible,
    modalAnimating,
    modalSlideAnim,
    backdropOpacityAnim,
    openModal,
    closeModal
  };
}