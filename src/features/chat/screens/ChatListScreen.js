import React, { useCallback } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { ErrorBoundary } from '../../../shared';
import ChatHeader from '../components/ChatHeader';
import ChatRoomItem from '../components/ChatRoomItem';
import ChatModals from '../components/ChatModals';
import { useChatListAuth } from '../hooks/useChatListAuth';
import { useChatRoomsList } from '../hooks/useChatRoomsList';
import { useChatSearch } from '../hooks/useChatSearch';
import { useChatModals } from '../hooks/useChatModals';
import { theme } from '../../../styles/theme';
import { useLanguage } from '../../../contexts/LanguageContext';

export default function ChatListScreen({ navigation }) {
  const { t } = useLanguage();
  
  // Custom Hooks
  const { user } = useChatListAuth();
  const { 
    chats, 
    loading, 
    lastMessages, 
    unreadCounts, 
    leaveRoom, 
    renameRoom 
  } = useChatRoomsList(user);
  
  const { 
    searchQuery, 
    setSearchQuery, 
    showSearchBar, 
    toggleSearchBar, 
    filteredChats 
  } = useChatSearch(chats);
  
  const {
    modalVisible,
    selectedRoom,
    renameModalVisible,
    newRoomName,
    setNewRoomName,
    openModal,
    closeModal,
    openRenameModal,
    closeRenameModal
  } = useChatModals();

  // 채팅방 클릭 핸들러
  const handleChatPress = useCallback(function(chat) {
    navigation.navigate('Chat', {
      roomId: chat.id,
      roomName: chat.name
    });
  }, [navigation]);

  // 채팅방 롱프레스 핸들러
  const handleChatLongPress = useCallback(function(chat) {
    openModal(chat);
  }, [openModal]);

  // 새 채팅 시작
  const handleNewChat = useCallback(function() {
    navigation.navigate('SelectFriendForChat');
  }, [navigation]);

  // FlatList 렌더링 함수
  const renderChatItem = useCallback(function({ item }) {
    return (
      <ChatRoomItem
        chat={item}
        lastMessage={lastMessages[item.id]}
        unreadCount={unreadCounts[item.id] || 0}
        onPress={function() { handleChatPress(item); }}
        onLongPress={function() { handleChatLongPress(item); }}
      />
    );
  }, [lastMessages, unreadCounts, handleChatPress, handleChatLongPress]);

  const keyExtractor = useCallback(function(item) { 
    return item.id; 
  }, []);

  // 로딩 상태
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ErrorBoundary name="ChatListScreen">
      <View style={styles.container}>
        <ChatHeader
          showSearchBar={showSearchBar}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onToggleSearch={toggleSearchBar}
          onNewChat={handleNewChat}
        />

        <FlatList
          data={filteredChats}
          renderItem={renderChatItem}
          keyExtractor={keyExtractor}
          style={styles.chatList}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          windowSize={21}
          initialNumToRender={15}
        />

        <ChatModals
          modalVisible={modalVisible}
          renameModalVisible={renameModalVisible}
          selectedRoom={selectedRoom}
          newRoomName={newRoomName}
          setNewRoomName={setNewRoomName}
          onCloseModal={closeModal}
          onCloseRenameModal={closeRenameModal}
          onOpenRenameModal={openRenameModal}
          onLeaveRoom={leaveRoom}
          onRenameRoom={renameRoom}
        />
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  chatList: {
    flex: 1,
  },
});