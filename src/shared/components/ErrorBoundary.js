import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { theme } from '../../styles/theme';
import Button from './Button';
import { productionError } from '../utils/logger';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // 개발 환경에서는 콘솔에, 프로덕션에서는 로깅 서비스에 전송
    const errorContext = this.props.name || 'Unknown Component';
    productionError(error, `ErrorBoundary: ${errorContext}`);

    // 에러 정보를 부모 컴포넌트에 전달 (선택사항)
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = function() {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>앗! 문제가 발생했습니다</Text>
          <Text style={styles.message}>
            {this.props.fallbackMessage || '예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'}
          </Text>
          
          {__DEV__ && this.state.error && (
            <View style={styles.errorDetails}>
              <Text style={styles.errorText}>
                {this.state.error.toString()}
              </Text>
            </View>
          )}

          <View style={styles.actions}>
            <Button
              title="다시 시도"
              onPress={this.handleRetry}
              variant="primary"
              size="medium"
              style={styles.retryButton}
            />
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 24,
  },
  errorDetails: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    marginBottom: theme.spacing.xl,
    maxWidth: '100%',
  },
  errorText: {
    fontSize: 12,
    color: theme.colors.error,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  retryButton: {
    minWidth: 120,
  },
});

export default ErrorBoundary;