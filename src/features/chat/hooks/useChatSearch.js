import { useState, useMemo } from 'react';

export function useChatSearch(chats) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchBar, setShowSearchBar] = useState(false);

  const filteredChats = useMemo(function() {
    if (!searchQuery.trim()) {
      return chats;
    }
    
    return chats.filter(function(chat) {
      const chatName = chat?.name || '';
      return chatName.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [chats, searchQuery]);

  const toggleSearchBar = function() {
    setShowSearchBar(function(prev) { 
      if (prev) {
        setSearchQuery('');
      }
      return !prev; 
    });
  };

  return {
    searchQuery,
    setSearchQuery,
    showSearchBar,
    toggleSearchBar,
    filteredChats
  };
}