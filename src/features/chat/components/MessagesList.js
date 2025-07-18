import React, { useCallback } from 'react';
import { FlatList, View, Text, StyleSheet } from 'react-native';
import MessageItem from './MessageItem';
import { theme } from '../../../styles/theme';

const MessagesList = React.memo(function MessagesList({
  messages,
  flatListRef,
  currentUser,
  username,
  onReply,
  onCopy,
  onDelete,
  isTyping
}) {
  
  const renderMessage = useCallback(function({ item, index }) {
    const isOwn = currentUser && (
      item.user_id === currentUser.id || 
      item.sender_id === currentUser.id ||
      (item.sender_name === username || item.username === username)
    );
    
    return (
      <MessageItem
        key={item.id || index}
        message={item}
        isOwn={isOwn}
        username={username}
        onReply={onReply}
        onCopy={onCopy}
        onDelete={onDelete}
      />
    );
  }, [currentUser, username, onReply, onCopy, onDelete]);

  const getItemLayout = useCallback(function(data, index) {
    return {
      length: 80,
      offset: 80 * index,
      index,
    };
  }, []);

  const keyExtractor = useCallback(function(item, index) { 
    return item.id?.toString() || index.toString(); 
  }, []);

  const handleContentSizeChange = useCallback(function() { 
    flatListRef.current?.scrollToEnd({ animated: true }); 
  }, [flatListRef]);

  const handleLayout = useCallback(function() { 
    flatListRef.current?.scrollToEnd({ animated: false }); 
  }, [flatListRef]);

  const renderTypingIndicator = useCallback(function() {
    if (isTyping.length === 0) return null;
    
    return (
      <View style={styles.typingIndicator}>
        <Text style={styles.typingText}>
          {isTyping.join(', ')}님이 입력중...
        </Text>
      </View>
    );
  }, [isTyping]);

  return (
    <FlatList 
      ref={flatListRef}
      data={messages}
      renderItem={renderMessage}
      keyExtractor={keyExtractor}
      style={styles.messagesContainer}
      contentContainerStyle={{ paddingBottom: 20 }}
      onContentSizeChange={handleContentSizeChange}
      onLayout={handleLayout}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={50}
      windowSize={21}
      getItemLayout={getItemLayout}
      initialNumToRender={20}
      ListFooterComponent={renderTypingIndicator}
    />
  );
});

const styles = StyleSheet.create({
  messagesContainer: {
    flex: 1,
    padding: 10,
  },
  typingIndicator: {
    padding: 10,
    marginLeft: 10,
  },
  typingText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
});

export default MessagesList;