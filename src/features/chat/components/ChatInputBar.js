import React from 'react';
import { View, TextInput, Button, StyleSheet } from 'react-native';
import MessageReply from './MessageReply';
import { theme } from '../../../styles/theme';

const ChatInputBar = React.memo(function ChatInputBar({
  inputMessage,
  setInputMessage,
  sendMessage,
  isUploading,
  replyTo,
  cancelReply,
  keyboardVisible
}) {
  
  return (
    <>
      <MessageReply 
        replyTo={replyTo} 
        onCancel={cancelReply} 
      />

      <View style={[styles.inputContainer, keyboardVisible && { marginBottom: 100 }]}>
        {/* 파일 업로드 버튼 임시 비활성화 - 나중에 다시 활성화 예정
        <FileUploadButton
          onFileSelected={handleFileSelected}
          disabled={!isConnected || isUploading}
          size={26}
        />
        */}
        <TextInput
          style={styles.textInput}
          value={inputMessage}
          onChangeText={setInputMessage}
          placeholder="메시지를 입력하세요..."
          editable={!isUploading}
          onSubmitEditing={sendMessage}
          maxLength={1000}
        />
        <Button 
          title={isUploading ? "업로드중..." : "전송"} 
          onPress={sendMessage}
          disabled={!inputMessage.trim() || isUploading}
        />
      </View>
    </>
  );
});

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: theme.colors.background,
    minHeight: 60,
    marginBottom: 50,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginHorizontal: 10,
    fontSize: 16,
    backgroundColor: theme.colors.surface,
    maxHeight: 100,
  },
});

export default ChatInputBar;