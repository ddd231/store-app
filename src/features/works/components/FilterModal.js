import React from 'react';
import { View, Text, TouchableOpacity, Modal, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../styles/theme';
import { useLanguage } from '../../../contexts/LanguageContext';

const FilterModal = React.memo(function FilterModal({
  visible,
  sortBy,
  setSortBy,
  modalSlideAnim,
  backdropOpacityAnim,
  onClose
}) {
  const { t } = useLanguage();

  function handleSortSelection(value) {
    setSortBy(value);
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View 
        style={[
          styles.modalBackdrop,
          { opacity: backdropOpacityAnim }
        ]}
      >
        <TouchableOpacity 
          style={StyleSheet.absoluteFillObject} 
          onPress={onClose}
          activeOpacity={1}
        />
        
        <Animated.View 
          style={[
            styles.modalContent,
            { transform: [{ translateY: modalSlideAnim }] }
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('sortBy')}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#000000" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.sortOption}
            onPress={function() { handleSortSelection('latest'); }}
          >
            <Text style={styles.sortOptionText}>
              {t('latest')}
            </Text>
            {sortBy === 'latest' && (
              <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.sortOption}
            onPress={function() { handleSortSelection('oldest'); }}
          >
            <Text style={styles.sortOptionText}>
              {t('oldest')}
            </Text>
            {sortBy === 'oldest' && (
              <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.sortOption}
            onPress={function() { handleSortSelection('random'); }}
          >
            <Text style={styles.sortOptionText}>
              {t('random')}
            </Text>
            {sortBy === 'random' && (
              <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
            )}
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    minHeight: 250,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  modalTitle: {
    ...theme.typography.heading,
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  sortOptionText: {
    ...theme.typography.body,
    fontSize: 16,
    color: '#000000',
  },
});

export default FilterModal;