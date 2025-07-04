/**
 * 최적화된 이미지 컴포넌트
 * 지연 로딩, 캐싱, 크기 최적화 기능 제공
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Image, View, StyleSheet, ActivityIndicator, Text, Dimensions } from 'react-native';
import { theme } from '../../styles/theme';

const { width: screenWidth } = Dimensions.get('window');

function OptimizedImage({
  source,
  style,
  placeholder,
  resizeMode = 'cover',
  width,
  height,
  quality = 'high', // 'high', 'medium', 'low'
  enableLazyLoading = true,
  cacheKey,
  onLoad,
  onError,
  ...props
}) { 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(!enableLazyLoading);

  // 이미지 크기 계산
  const imageSize = useMemo(function() {
    if (width && height) {
      return { width, height };
    }
    
    // 기본 크기 설정
    const defaultWidth = width || screenWidth * 0.8;
    const defaultHeight = height || defaultWidth * 0.6;
    
    return { width: defaultWidth, height: defaultHeight };
  }, [width, height]);

  // 품질에 따른 압축 설정
  const compressionQuality = useMemo(function() {
    switch (quality) {
      case 'low':
        return 0.3;
      case 'medium':
        return 0.7;
      case 'high':
      default:
        return 0.9;
    }
  }, [quality]);

  // 이미지 URL 최적화 (필요시 리사이징 파라미터 추가)
  const optimizedSource = useMemo(function() {
    if (!source || !source.uri) return source;

    let uri = source.uri;
    
    // Supabase 또는 다른 이미지 서비스의 리사이징 파라미터 추가
    if (uri.includes('supabase') && imageSize.width && imageSize.height) {
      const separator = uri.includes('?') ? '&' : '?';
      uri += `${separator}width=${Math.round(imageSize.width)}&height=${Math.round(imageSize.height)}&resize=cover&quality=${Math.round(compressionQuality * 100)}`;
    }

    return { ...source, uri };
  }, [source, imageSize, compressionQuality]);

  const handleLoad = useCallback(function(event) {
    setLoading(false);
    setError(false);
    onLoad?.(event);
  }, [onLoad]);

  const handleError = useCallback(function(event) {
    setLoading(false);
    setError(true);
    onError?.(event);
  }, [onError]);

  const handleLayout = useCallback(function() {
    if (enableLazyLoading && !hasAttemptedLoad) {
      setHasAttemptedLoad(true);
    }
  }, [enableLazyLoading, hasAttemptedLoad]);

  // 로딩 상태 컴포넌트
  function renderLoading() {
    return (
      <View style={[styles.loadingContainer, imageSize]}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  }

  // 에러 상태 컴포넌트
  function renderError() {
    return (
      <View style={[styles.errorContainer, imageSize]}>
        <Text style={styles.errorText}>이미지를 불러올 수 없습니다</Text>
      </View>
    );
  }

  // 플레이스홀더 컴포넌트
  function renderPlaceholder() {
    if (placeholder) {
      return typeof placeholder === 'string' ? (
        <View style={[styles.placeholderContainer, imageSize]}>
          <Text style={styles.placeholderText}>{placeholder}</Text>
        </View>
      ) : placeholder;
    }
    return renderLoading();
  };

  // 지연 로딩이 활성화되었지만 아직 로드 시도하지 않은 경우
  if (enableLazyLoading && !hasAttemptedLoad) {
    return (
      <View onLayout={handleLayout} style={[imageSize, style]}>
        {renderPlaceholder()}
      </View>
    );
  }

  // 에러 상태
  if (error) {
    return renderError();
  }

  return (
    <View style={[imageSize, style]}>
      {loading && renderLoading()}
      <Image
        {...props}
        source={optimizedSource}
        style={[
          imageSize,
          style,
          loading && { opacity: 0 } // 로딩 중에는 숨김
        ]}
        resizeMode={resizeMode}
        onLoad={handleLoad}
        onError={handleError}
        // React Native 0.60+ 캐싱 설정
        cache="force-cache"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
  },
  errorText: {
    color: theme.colors.text.secondary,
    fontSize: 12,
    textAlign: 'center',
  },
  placeholderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
  },
  placeholderText: {
    color: theme.colors.text.secondary,
    fontSize: 14,
  },
});

export default React.memo(OptimizedImage);