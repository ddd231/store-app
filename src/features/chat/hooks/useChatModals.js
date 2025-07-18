import { useState } from 'react';

export function useChatModals() {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');

  const openModal = function(room) {
    setSelectedRoom(room);
    setModalVisible(true);
  };

  const closeModal = function() {
    setModalVisible(false);
    setSelectedRoom(null);
  };

  const openRenameModal = function(room) {
    setSelectedRoom(room);
    setNewRoomName(room.name);
    setRenameModalVisible(true);
    setModalVisible(false);
  };

  const closeRenameModal = function() {
    setRenameModalVisible(false);
    setSelectedRoom(null);
    setNewRoomName('');
  };

  return {
    modalVisible,
    selectedRoom,
    renameModalVisible,
    newRoomName,
    setNewRoomName,
    openModal,
    closeModal,
    openRenameModal,
    closeRenameModal
  };
}