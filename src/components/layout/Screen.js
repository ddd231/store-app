import React from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../styles/theme';
import Header from '../common/Header';
import LoadingSpinner from '../common/LoadingSpinner';

const Screen = ({ 
  children,
  loading = false,
  loadingText,
  header,
  headerProps = {},
  keyboardAvoiding = false,
  safeArea = true,
  style,
  contentStyle,
  backgroundColor = theme.colors.background,
}) => {
  const content = (
    <View style={[styles.container, { backgroundColor }, style]}>
      {header && <Header {...headerProps} />}
      
      <View style={[styles.content, contentStyle]}>
        {children}
      </View>
      
      {loading && (
        <LoadingSpinner 
          fullScreen 
          text={loadingText}
        />
      )}
    </View>
  );

  if (keyboardAvoiding) {
    return (
      <KeyboardAvoidingView 
        style={styles.flex} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {safeArea ? (
          <SafeAreaView style={styles.flex}>
            {content}
          </SafeAreaView>
        ) : content}
      </KeyboardAvoidingView>
    );
  }

  return safeArea ? (
    <SafeAreaView style={styles.flex}>
      {content}
    </SafeAreaView>
  ) : content;
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});

export default Screen;