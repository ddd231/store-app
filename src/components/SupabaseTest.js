import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator } from 'react-native';
import { testSupabaseConnection, listBuckets } from '../services/supabaseClient';

const SupabaseTest = () => {
  const [connectionStatus, setConnectionStatus] = useState('아직 테스트하지 않음');
  const [buckets, setBuckets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const testConnection = async () => {
    setIsLoading(true);
    setConnectionStatus('테스트 중...');
    
    try {
      const result = await testSupabaseConnection();
      if (result.success) {
        setConnectionStatus('연결 성공!');
      } else {
        setConnectionStatus(`연결 실패: ${result.error}`);
      }
    } catch (error) {
      setConnectionStatus(`오류 발생: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBuckets = async () => {
    setIsLoading(true);
    
    try {
      const result = await listBuckets();
      if (result.success) {
        setBuckets(result.data);
      } else {
        console.error('버킷 가져오기 실패:', result.error);
        setBuckets([]);
      }
    } catch (error) {
      console.error('버킷 가져오기 오류:', error.message);
      setBuckets([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Supabase 연결 테스트</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.label}>연결 상태:</Text>
        <Text style={styles.status}>{connectionStatus}</Text>
      </View>
      
      <Button 
        title="연결 테스트하기" 
        onPress={testConnection} 
        disabled={isLoading}
      />
      
      <View style={styles.separator} />
      
      <Button 
        title="버킷 목록 가져오기" 
        onPress={fetchBuckets} 
        disabled={isLoading}
      />
      
      {isLoading && <ActivityIndicator style={styles.spinner} />}
      
      {buckets.length > 0 ? (
        <View style={styles.bucketContainer}>
          <Text style={styles.label}>버킷 목록:</Text>
          {buckets.map((bucket, index) => (
            <Text key={index} style={styles.bucketItem}>
              {bucket.name}
            </Text>
          ))}
        </View>
      ) : (
        <Text style={styles.bucketMessage}>
          {isLoading ? '버킷 가져오는 중...' : '버킷이 없거나 아직 가져오지 않았습니다.'}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  statusContainer: {
    marginBottom: 15,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  status: {
    fontSize: 16,
  },
  separator: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 20,
  },
  bucketContainer: {
    marginTop: 20,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
  },
  bucketItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  bucketMessage: {
    marginTop: 20,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  spinner: {
    marginTop: 20,
  }
});

export default SupabaseTest; 