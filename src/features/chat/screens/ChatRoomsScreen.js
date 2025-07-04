import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Button, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getChatRooms, createChatRoom, getUnreadMessageCount } from '../services/chatService';

export default function ChatRoomsScreen({ navigation }) {
  const [rooms, setRooms] = useState([
    { id: 'general', name: '일반 채팅방', lastMessage: '환영합니다!', unread_count: 0 },
    { id: 'tech', name: '기술 토론방', lastMessage: '새로운 React 기능이...', unread_count: 0 },
    { id: 'art', name: '예술 작품방', lastMessage: '오늘의 작품을 공유합니다', unread_count: 0 },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadChatRooms();
  }, []);

  const loadChatRooms = async () => {
    setIsLoading(true);
    try {
      const result = await getChatRooms();
      if (result.success && result.rooms.length > 0) {
        setRooms(result.rooms);
      }
      
      // 읽지 않은 메시지 수 업데이트
      const unreadResult = await getUnreadMessageCount();
      if (unreadResult.success) {
        setRooms(prevRooms => 
          prevRooms.map(room => ({
            ...room,
            unread_count: unreadResult.roomUnread[room.id] || 0
          }))
        );
      }
    } catch (error) {
      console.error('[ChatRoomsScreen] 채팅방 로드 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRoom = () => {
    Alert.prompt(
      '새 채팅방 만들기',
      '채팅방 이름을 입력하세요:',
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '생성', 
          onPress: async (roomName) => {
            if (roomName && roomName.trim()) {
              const result = await createChatRoom(roomName.trim());
              if (result.success) {
                Alert.alert('성공', '채팅방이 생성되었습니다!');
                loadChatRooms(); // 목록 새로고침
              } else {
                Alert.alert('오류', result.error || '채팅방 생성에 실패했습니다.');
              }
            }
          }
        }
      ],
      'plain-text'
    );
  };

  const renderRoom = ({ item }) => (
    <TouchableOpacity 
      style={styles.roomItem}
      onPress={() => navigation.navigate('Chat', { roomId: item.id, roomName: item.name })}
    >
      <View style={styles.roomIcon}>
        <Ionicons name="chatbubbles" size={30} color="#007AFF" />
      </View>
      <View style={styles.roomInfo}>
        <View style={styles.roomHeader}>
          <Text style={styles.roomName}>{item.name}</Text>
          {item.unread_count > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>
                {item.unread_count > 99 ? '99+' : item.unread_count}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.lastMessage}>{item.lastMessage}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#CCC" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>채팅방 목록</Text>
      <FlatList
        data={rooms}
        renderItem={renderRoom}
        keyExtractor={item => item.id}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
      <View style={styles.createButton}>
        <Button 
          title={isLoading ? "로딩중..." : "새 채팅방 만들기"} 
          onPress={handleCreateRoom}
          disabled={isLoading}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 20,
    backgroundColor: '#fff',
  },
  roomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
  },
  roomIcon: {
    marginRight: 15,
  },
  roomInfo: {
    flex: 1,
  },
  roomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  roomName: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  unreadText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
  },
  createButton: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
});